/**
 * Comprehensive per-tenant detail endpoints — power the /admin/tenants/[id]
 * tabbed page. Every route is super-admin only and reads across RLS via
 * db.withSuperAdmin so we can see every tenant's data.
 *
 * Endpoints (all mounted at /api/v1/admin/tenants/:id/...):
 *   GET /summary       — hero card data + KPIs + subscription + counts
 *   GET /users         — users for this tenant (filter by ?role=)
 *   GET /bookings      — bookings with customer + service joined
 *   GET /customers     — end customers
 *   GET /services      — services with category + pricing rule count
 *   GET /revenue       — invoices + subscription + revenue metrics
 *   GET /activity      — audit log scoped to this tenant
 *   GET /timeline      — daily bookings + revenue series for the chart
 *   GET /commissions   — commission structures for this tenant
 */
const { db, jwt: jwtUtil } = require('@hs/shared');

function requireSuperAdmin(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) { reply.code(401).send({ error: 'missing bearer token' }); return false; }
  try {
    const payload = jwtUtil.verify(auth.slice(7));
    if (payload.role !== 'super_admin') { reply.code(403).send({ error: 'super_admin role required' }); return false; }
    req.user = payload;
    return true;
  } catch { reply.code(401).send({ error: 'invalid token' }); return false; }
}

module.exports = async function (app) {
  // ===== Summary — single hit gives hero + KPI strip data =====
  app.get('/tenants/:id/summary', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;

    return db.withSuperAdmin(async (c) => {
      const tenant = await c.query(
        `SELECT t.tenant_id, t.business_name, t.subdomain, t.custom_domain, t.plan_tier,
                t.logo_url, t.theme_config, t.business_details, t.onboarding_status,
                t.is_active, t.created_at, t.updated_at
         FROM tenants t WHERE t.tenant_id = $1 AND t.subdomain != '__platform__'`,
        [tenantId]
      );
      if (!tenant.rows[0]) { reply.code(404); return { error: 'not found' }; }

      // Counts in parallel for speed.
      const [counts, subscription, rev30, rev_all, lastBooking, lastLogin] = await Promise.all([
        c.query(
          `SELECT
            (SELECT COUNT(*)::int FROM users     WHERE tenant_id = $1) AS users,
            (SELECT COUNT(*)::int FROM users     WHERE tenant_id = $1 AND role = 'business_admin')                 AS admins,
            (SELECT COUNT(*)::int FROM users     WHERE tenant_id = $1 AND role = 'staff')                          AS staff,
            (SELECT COUNT(*)::int FROM services  WHERE tenant_id = $1)                                             AS services,
            (SELECT COUNT(*)::int FROM services  WHERE tenant_id = $1 AND is_active = true)                        AS active_services,
            (SELECT COUNT(*)::int FROM customers WHERE tenant_id = $1)                                             AS customers,
            (SELECT COUNT(*)::int FROM bookings  WHERE tenant_id = $1)                                             AS bookings,
            (SELECT COUNT(*)::int FROM bookings  WHERE tenant_id = $1 AND status = 'completed')                    AS completed_bookings,
            (SELECT COUNT(*)::int FROM service_categories  WHERE tenant_id = $1)                                   AS categories,
            (SELECT COUNT(*)::int FROM commission_structures WHERE tenant_id = $1 AND is_active = true)            AS commissions
          `,
          [tenantId]
        ),
        c.query(
          `SELECT s.*, p.name AS plan_name, p.price_monthly
           FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
           WHERE s.tenant_id = $1`,
          [tenantId]
        ),
        c.query(
          `SELECT COALESCE(SUM(total_cents), 0)::int AS cents
           FROM invoices WHERE tenant_id = $1 AND status = 'paid'
             AND paid_at >= NOW() - INTERVAL '30 days'`,
          [tenantId]
        ),
        c.query(
          `SELECT COALESCE(SUM(total_cents), 0)::int AS cents,
                  COUNT(*)::int AS invoice_count
           FROM invoices WHERE tenant_id = $1 AND status = 'paid'`,
          [tenantId]
        ),
        c.query(
          `SELECT scheduled_at FROM bookings WHERE tenant_id = $1
           ORDER BY created_at DESC LIMIT 1`,
          [tenantId]
        ),
        c.query(
          `SELECT MAX(last_login_at) AS last_login FROM users WHERE tenant_id = $1`,
          [tenantId]
        ),
      ]);

      // Lifetime booking revenue (using quoted_price on bookings, paid or not — gives
      // a sense of total business value even before invoicing).
      const bookingRevenue = await c.query(
        `SELECT COALESCE(SUM(quoted_price), 0)::float AS total,
                COALESCE(AVG(quoted_price), 0)::float AS avg
         FROM bookings WHERE tenant_id = $1`,
        [tenantId]
      );

      return {
        tenant: tenant.rows[0],
        counts: counts.rows[0],
        subscription: subscription.rows[0] || null,
        revenue: {
          paid_30d_cents:  rev30.rows[0].cents,
          paid_total_cents: rev_all.rows[0].cents,
          paid_invoice_count: rev_all.rows[0].invoice_count,
          booking_value_total: Number(bookingRevenue.rows[0].total),
          booking_value_avg:   Number(bookingRevenue.rows[0].avg),
        },
        last_booking_at: lastBooking.rows[0]?.scheduled_at || null,
        last_login_at: lastLogin.rows[0]?.last_login || null,
      };
    });
  });

  // ===== Users =====
  app.get('/tenants/:id/users', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;
    const role = req.query.role;

    return db.withSuperAdmin(async (c) => {
      const params = [tenantId];
      let where = 'tenant_id = $1';
      if (role) { params.push(role); where += ` AND role = $${params.length}`; }
      const { rows } = await c.query(
        `SELECT id, email, full_name, role, is_active, last_login_at, created_at
         FROM users WHERE ${where} ORDER BY created_at DESC`,
        params
      );
      return { data: rows };
    });
  });

  // ===== Bookings (with customer + service joined) =====
  app.get('/tenants/:id/bookings', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    return db.withSuperAdmin(async (c) => {
      const params = [tenantId, limit];
      let where = 'b.tenant_id = $1';
      if (status) { params.push(status); where += ` AND b.status = $${params.length}`; }
      const { rows } = await c.query(
        `SELECT b.id, b.scheduled_at, b.status, b.quoted_price, b.notes, b.created_at,
                b.assigned_staff,
                c2.full_name AS customer_name, c2.email AS customer_email,
                s.title AS service_title,
                u.full_name AS staff_name
         FROM bookings b
         LEFT JOIN customers c2 ON c2.id = b.customer_id
         LEFT JOIN services  s  ON s.id  = b.service_id
         LEFT JOIN users     u  ON u.id  = b.assigned_staff
         WHERE ${where}
         ORDER BY b.scheduled_at DESC LIMIT $2`,
        params
      );

      // Aggregate stats for the bookings tab header
      const stats = await c.query(
        `SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'pending')::int     AS pending,
          COUNT(*) FILTER (WHERE status = 'confirmed')::int   AS confirmed,
          COUNT(*) FILTER (WHERE status = 'in_progress')::int AS in_progress,
          COUNT(*) FILTER (WHERE status = 'completed')::int   AS completed,
          COUNT(*) FILTER (WHERE status = 'cancelled')::int   AS cancelled,
          COALESCE(SUM(quoted_price), 0)::float               AS total_value,
          COALESCE(SUM(quoted_price) FILTER (WHERE status = 'completed'), 0)::float AS earned
         FROM bookings WHERE tenant_id = $1`,
        [tenantId]
      );

      return { data: rows, stats: stats.rows[0] };
    });
  });

  // ===== Customers =====
  app.get('/tenants/:id/customers', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT c.id, c.full_name, c.email, c.phone, c.address, c.created_at,
                (SELECT COUNT(*)::int FROM bookings b WHERE b.customer_id = c.id)         AS booking_count,
                (SELECT COALESCE(SUM(b.quoted_price), 0)::float FROM bookings b WHERE b.customer_id = c.id) AS total_spend,
                (SELECT MAX(b.scheduled_at) FROM bookings b WHERE b.customer_id = c.id)   AS last_booking_at
         FROM customers c
         WHERE c.tenant_id = $1
         ORDER BY total_spend DESC NULLS LAST, c.created_at DESC
         LIMIT 200`,
        [tenantId]
      );
      return { data: rows };
    });
  });

  // ===== Services (with category + pricing rule count) =====
  app.get('/tenants/:id/services', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;

    return db.withSuperAdmin(async (c) => {
      const [services, categories] = await Promise.all([
        c.query(
          `SELECT s.id, s.title, s.description, s.base_price, s.duration_mins, s.is_active, s.created_at,
                  cat.id AS category_id, cat.name AS category_name,
                  (SELECT COUNT(*)::int FROM pricing_structures p WHERE p.service_id = s.id) AS rule_count,
                  (SELECT COUNT(*)::int FROM bookings b WHERE b.service_id = s.id)            AS booking_count,
                  (SELECT COALESCE(SUM(b.quoted_price), 0)::float FROM bookings b WHERE b.service_id = s.id) AS revenue
           FROM services s
           LEFT JOIN service_categories cat ON cat.id = s.category_id
           WHERE s.tenant_id = $1
           ORDER BY booking_count DESC NULLS LAST, s.title`,
          [tenantId]
        ),
        c.query(
          `SELECT id, name, parent_category_id, is_active,
                  (SELECT COUNT(*)::int FROM services s WHERE s.category_id = service_categories.id) AS service_count
           FROM service_categories WHERE tenant_id = $1
           ORDER BY parent_category_id NULLS FIRST, sort_order, name`,
          [tenantId]
        ),
      ]);
      return { services: services.rows, categories: categories.rows };
    });
  });

  // ===== Revenue (invoices + earnings breakdown) =====
  app.get('/tenants/:id/revenue', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;

    return db.withSuperAdmin(async (c) => {
      const [invoices, totals, subscription] = await Promise.all([
        c.query(
          `SELECT id, invoice_number, status, subtotal_cents, tax_cents, total_cents,
                  currency, issued_at, due_at, paid_at
           FROM invoices WHERE tenant_id = $1
           ORDER BY issued_at DESC LIMIT 50`,
          [tenantId]
        ),
        c.query(
          `SELECT
            COALESCE(SUM(total_cents) FILTER (WHERE status = 'paid'), 0)::int     AS paid_cents,
            COALESCE(SUM(total_cents) FILTER (WHERE status IN ('sent','overdue')), 0)::int AS outstanding_cents,
            COALESCE(SUM(total_cents) FILTER (WHERE status = 'refunded'), 0)::int AS refunded_cents,
            COALESCE(SUM(tax_cents) FILTER (WHERE status = 'paid'), 0)::int        AS tax_collected_cents,
            COUNT(*) FILTER (WHERE status = 'paid')::int                            AS paid_count,
            COUNT(*) FILTER (WHERE status IN ('sent','overdue'))::int               AS outstanding_count
           FROM invoices WHERE tenant_id = $1`,
          [tenantId]
        ),
        c.query(
          `SELECT s.*, p.name AS plan_name, p.price_monthly, p.features, p.resource_limits
           FROM subscriptions s JOIN subscription_plans p ON p.id = s.plan_id
           WHERE s.tenant_id = $1`,
          [tenantId]
        ),
      ]);
      return {
        invoices: invoices.rows,
        totals: totals.rows[0],
        subscription: subscription.rows[0] || null,
      };
    });
  });

  // ===== Activity (audit log scoped to tenant) =====
  app.get('/tenants/:id/activity', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT a.id, a.actor_id, a.entity_type, a.entity_id, a.action,
                a.old_value, a.new_value, a.created_at,
                u.email AS actor_email, u.full_name AS actor_name, u.role AS actor_role
         FROM audit_logs a
         LEFT JOIN users u ON u.id = a.actor_id
         WHERE a.tenant_id = $1
         ORDER BY a.created_at DESC LIMIT $2`,
        [tenantId, limit]
      );
      return { data: rows };
    });
  });

  // ===== Timeline — daily bookings + revenue for the chart =====
  app.get('/tenants/:id/timeline', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;
    const days = Math.min(parseInt(req.query.days || '30', 10), 365);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT to_char(d, 'YYYY-MM-DD') AS day,
                COALESCE(COUNT(b.id), 0)::int AS bookings,
                COALESCE(SUM(b.quoted_price), 0)::float AS revenue
         FROM generate_series(
                CURRENT_DATE - ($1 - 1) * INTERVAL '1 day',
                CURRENT_DATE,
                '1 day') d
         LEFT JOIN bookings b ON b.created_at::date = d::date AND b.tenant_id = $2
         GROUP BY d ORDER BY d`,
        [days, tenantId]
      );
      return { data: rows };
    });
  });

  // ===== Commissions =====
  app.get('/tenants/:id/commissions', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const tenantId = req.params.id;

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT id, name, applies_to, target_id, rate_type, rate_value,
                min_amount, max_amount, is_active, created_at
         FROM commission_structures WHERE tenant_id = $1
         ORDER BY applies_to, name`,
        [tenantId]
      );
      return { data: rows };
    });
  });

  // ===========================================================================
  // PER-USER DRILLDOWN (under a tenant)
  //
  // Routes here are nested as /tenants/:id/users/:userId/... and power the
  // extensive user detail page. They cover everything a super admin would need
  // to know about a single user inside a tenant.
  // ===========================================================================

  // GET /tenants/:id/users/:userId — full profile with computed stats
  app.get('/tenants/:id/users/:userId', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { id: tenantId, userId } = req.params;

    return db.withSuperAdmin(async (c) => {
      const userRes = await c.query(
        `SELECT u.id, u.tenant_id, u.email, u.full_name, u.role, u.is_active,
                u.last_login_at, u.created_at, u.updated_at,
                t.business_name, t.subdomain
         FROM users u JOIN tenants t ON t.tenant_id = u.tenant_id
         WHERE u.id = $1 AND u.tenant_id = $2`,
        [userId, tenantId]
      );
      if (!userRes.rows[0]) { reply.code(404); return { error: 'user not found' }; }
      const user = userRes.rows[0];

      // Stats vary by role. For staff: counts of bookings assigned + earnings.
      // For business_admin: counts of audit actions taken + bookings created.
      const [bookingStats, activityStats, commissionRules] = await Promise.all([
        c.query(
          `SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
            COUNT(*) FILTER (WHERE status = 'pending')::int   AS pending,
            COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled,
            COALESCE(SUM(quoted_price) FILTER (WHERE status = 'completed'), 0)::float AS revenue
           FROM bookings WHERE tenant_id = $1 AND assigned_staff = $2`,
          [tenantId, userId]
        ),
        c.query(
          `SELECT COUNT(*)::int AS n,
                  MIN(created_at) AS first_action,
                  MAX(created_at) AS last_action
           FROM audit_logs WHERE tenant_id = $1 AND actor_id = $2`,
          [tenantId, userId]
        ),
        c.query(
          `SELECT * FROM commission_structures
           WHERE tenant_id = $1 AND is_active = true
             AND applies_to IN ('staff', 'platform')`,
          [tenantId]
        ),
      ]);

      // Compute estimated earnings: for staff, apply the active staff-commission
      // rule (if any) to their completed-booking revenue.
      const completedRevenue = Number(bookingStats.rows[0].revenue);
      const staffRule = commissionRules.rows.find((r) => r.applies_to === 'staff');
      let earnedEstimate = 0;
      if (staffRule) {
        if (staffRule.rate_type === 'percent') earnedEstimate = completedRevenue * (Number(staffRule.rate_value) / 100);
        else earnedEstimate = completedRevenue > 0 ? bookingStats.rows[0].completed * Number(staffRule.rate_value) : 0;
      }

      return {
        user,
        booking_stats: bookingStats.rows[0],
        activity_stats: activityStats.rows[0],
        commission_rule: staffRule || null,
        earned_estimate: Math.round(earnedEstimate * 100) / 100,
      };
    });
  });

  // GET /tenants/:id/users/:userId/bookings — bookings assigned to this user
  app.get('/tenants/:id/users/:userId/bookings', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { id: tenantId, userId } = req.params;
    const status = req.query.status;

    return db.withSuperAdmin(async (c) => {
      const params = [tenantId, userId];
      let where = 'b.tenant_id = $1 AND b.assigned_staff = $2';
      if (status) { params.push(status); where += ` AND b.status = $${params.length}`; }
      const { rows } = await c.query(
        `SELECT b.id, b.scheduled_at, b.status, b.quoted_price, b.notes, b.created_at,
                cu.full_name AS customer_name, cu.email AS customer_email,
                s.title AS service_title
         FROM bookings b
         LEFT JOIN customers cu ON cu.id = b.customer_id
         LEFT JOIN services  s  ON s.id  = b.service_id
         WHERE ${where}
         ORDER BY b.scheduled_at DESC
         LIMIT 200`,
        params
      );
      return { data: rows };
    });
  });

  // GET /tenants/:id/users/:userId/earnings — payment / commission breakdown
  app.get('/tenants/:id/users/:userId/earnings', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { id: tenantId, userId } = req.params;

    return db.withSuperAdmin(async (c) => {
      // Per-booking earnings: completed bookings assigned to this user.
      const bookings = await c.query(
        `SELECT b.id, b.scheduled_at, b.quoted_price, b.status,
                s.title AS service_title,
                cu.full_name AS customer_name
         FROM bookings b
         LEFT JOIN services  s  ON s.id  = b.service_id
         LEFT JOIN customers cu ON cu.id = b.customer_id
         WHERE b.tenant_id = $1 AND b.assigned_staff = $2 AND b.status = 'completed'
         ORDER BY b.scheduled_at DESC
         LIMIT 200`,
        [tenantId, userId]
      );

      // Find the applicable commission rule for staff.
      const ruleRes = await c.query(
        `SELECT * FROM commission_structures
         WHERE tenant_id = $1 AND applies_to = 'staff' AND is_active = true
         LIMIT 1`,
        [tenantId]
      );
      const rule = ruleRes.rows[0] || null;

      // Apply the rule to each booking and sum.
      const earnings = bookings.rows.map((b) => {
        const price = Number(b.quoted_price || 0);
        let amount = 0;
        if (rule) {
          if (rule.rate_type === 'percent') amount = price * (Number(rule.rate_value) / 100);
          else amount = Number(rule.rate_value);
        }
        return { ...b, earned: Math.round(amount * 100) / 100 };
      });

      // Aggregate by month for the chart.
      const byMonthMap = new Map();
      earnings.forEach((e) => {
        const ym = new Date(e.scheduled_at).toISOString().slice(0, 7);
        byMonthMap.set(ym, (byMonthMap.get(ym) || 0) + e.earned);
      });
      const by_month = Array.from(byMonthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, total]) => ({ month, total: Math.round(total * 100) / 100 }));

      const totalEarned = earnings.reduce((s, e) => s + e.earned, 0);
      const totalCustomerSpend = earnings.reduce((s, e) => s + Number(e.quoted_price || 0), 0);

      return {
        rule,
        earnings,
        by_month,
        totals: {
          jobs_completed: earnings.length,
          total_earned: Math.round(totalEarned * 100) / 100,
          customer_spend: Math.round(totalCustomerSpend * 100) / 100,
          avg_per_job: earnings.length ? Math.round((totalEarned / earnings.length) * 100) / 100 : 0,
        },
      };
    });
  });

  // GET /tenants/:id/users/:userId/activity — audit actions taken by this user
  app.get('/tenants/:id/users/:userId/activity', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { id: tenantId, userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT id, entity_type, entity_id, action, old_value, new_value, created_at
         FROM audit_logs
         WHERE tenant_id = $1 AND actor_id = $2
         ORDER BY created_at DESC
         LIMIT $3`,
        [tenantId, userId, limit]
      );
      return { data: rows };
    });
  });

  // PATCH /tenants/:id/users/:userId — toggle active state or role
  app.patch('/tenants/:id/users/:userId', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { id: tenantId, userId } = req.params;
    const { is_active, role } = req.body || {};

    const updates = [];
    const params = [];
    if (typeof is_active === 'boolean') { params.push(is_active); updates.push(`is_active = $${params.length}`); }
    if (role && ['business_admin', 'staff', 'viewer'].includes(role)) {
      params.push(role); updates.push(`role = $${params.length}`);
    }
    if (!updates.length) { reply.code(400); return { error: 'no updates' }; }
    params.push(userId, tenantId);

    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${params.length - 1} AND tenant_id = $${params.length}
         RETURNING id, email, role, is_active`,
        params
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'user not found' }; }
    return rows[0];
  });
};

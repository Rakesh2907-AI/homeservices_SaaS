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
};

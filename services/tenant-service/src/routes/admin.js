/**
 * Super-admin-only endpoints. These bypass tenant RLS because the operator
 * is the platform owner. Each route validates the JWT carries
 * `role: 'super_admin'`.
 */
const { db, jwt: jwtUtil } = require('@hs/shared');

function requireSuperAdmin(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'missing bearer token' });
    return false;
  }
  try {
    const payload = jwtUtil.verify(auth.slice(7));
    if (payload.role !== 'super_admin') {
      reply.code(403).send({ error: 'super_admin role required' });
      return false;
    }
    req.user = payload;
    return true;
  } catch {
    reply.code(401).send({ error: 'invalid token' });
    return false;
  }
}

module.exports = async function (app) {
  // ----- platform-wide stats -----
  app.get('/stats', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;

    return db.withSuperAdmin(async (c) => {
      const [tenants, users, bookings, services] = await Promise.all([
        c.query("SELECT COUNT(*)::int AS n FROM tenants WHERE subdomain != '__platform__'"),
        c.query("SELECT COUNT(*)::int AS n FROM users WHERE role != 'super_admin'"),
        c.query('SELECT COUNT(*)::int AS n FROM bookings'),
        c.query('SELECT COUNT(*)::int AS n FROM services'),
      ]);
      const planMix = await c.query(
        `SELECT plan_tier, COUNT(*)::int AS n
         FROM tenants WHERE subdomain != '__platform__' AND is_active = true
         GROUP BY plan_tier ORDER BY n DESC`
      );
      return {
        tenants: tenants.rows[0].n,
        users: users.rows[0].n,
        bookings: bookings.rows[0].n,
        services: services.rows[0].n,
        plan_mix: planMix.rows,
      };
    });
  });

  // ----- list tenants (paginated) -----
  app.get('/tenants', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT t.tenant_id, t.business_name, t.subdomain, t.plan_tier, t.is_active,
                t.logo_url, t.created_at,
                t.onboarding_status->>'completed' AS onboarded,
                (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.tenant_id) AS user_count,
                (SELECT COUNT(*)::int FROM bookings b WHERE b.tenant_id = t.tenant_id) AS booking_count
         FROM tenants t
         WHERE subdomain != '__platform__'
         ORDER BY created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      );
      return { data: rows, limit, offset };
    });
  });

  // ----- tenant detail (full record + nested counts) -----
  app.get('/tenants/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;

    return db.withSuperAdmin(async (c) => {
      const tenant = await c.query(
        `SELECT t.*,
                (SELECT COUNT(*)::int FROM users u WHERE u.tenant_id = t.tenant_id) AS user_count,
                (SELECT COUNT(*)::int FROM bookings b WHERE b.tenant_id = t.tenant_id) AS booking_count,
                (SELECT COUNT(*)::int FROM services s WHERE s.tenant_id = t.tenant_id) AS service_count,
                (SELECT COUNT(*)::int FROM customers c2 WHERE c2.tenant_id = t.tenant_id) AS customer_count,
                (SELECT COUNT(*)::int FROM commission_structures cs WHERE cs.tenant_id = t.tenant_id) AS commission_count
         FROM tenants t WHERE tenant_id = $1`,
        [req.params.id]
      );
      if (!tenant.rows[0]) { reply.code(404); return { error: 'tenant not found' }; }

      const [users, recentBookings] = await Promise.all([
        c.query(
          `SELECT id, email, full_name, role, is_active, last_login_at, created_at
           FROM users WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [req.params.id]
        ),
        c.query(
          `SELECT id, customer_id, scheduled_at, status, quoted_price, notes, created_at
           FROM bookings WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 10`,
          [req.params.id]
        ),
      ]);

      return {
        tenant: tenant.rows[0],
        users: users.rows,
        recent_bookings: recentBookings.rows,
      };
    });
  });

  // ----- update tenant (active state, plan tier) -----
  app.patch('/tenants/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { is_active, plan_tier } = req.body || {};

    const updates = [];
    const params = [];
    if (typeof is_active === 'boolean') { params.push(is_active); updates.push(`is_active = $${params.length}`); }
    if (typeof plan_tier === 'string') { params.push(plan_tier); updates.push(`plan_tier = $${params.length}`); }
    if (!updates.length) { reply.code(400); return { error: 'no updates' }; }

    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `UPDATE tenants SET ${updates.join(', ')}, updated_at = NOW()
         WHERE tenant_id = $${params.length} AND subdomain != '__platform__'
         RETURNING tenant_id, is_active, plan_tier`,
        params
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'tenant not found' }; }
    return rows[0];
  });

  // ----- cross-tenant users -----
  app.get('/users', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const search = (req.query.search || '').toLowerCase();
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.last_login_at, u.created_at,
                t.business_name, t.subdomain, t.tenant_id
         FROM users u JOIN tenants t ON t.tenant_id = u.tenant_id
         WHERE t.subdomain != '__platform__'
           AND ($1 = '' OR LOWER(u.email) LIKE '%' || $1 || '%' OR LOWER(u.full_name) LIKE '%' || $1 || '%')
         ORDER BY u.created_at DESC
         LIMIT $2`,
        [search, limit]
      );
      return { data: rows };
    });
  });

  // ----- cross-tenant bookings -----
  app.get('/bookings', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const status = req.query.status;
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);

    return db.withSuperAdmin(async (c) => {
      const params = [limit];
      let where = "WHERE t.subdomain != '__platform__'";
      if (status) { params.push(status); where += ` AND b.status = $${params.length}`; }
      const { rows } = await c.query(
        `SELECT b.id, b.tenant_id, b.scheduled_at, b.status, b.quoted_price, b.notes, b.created_at,
                t.business_name, t.subdomain,
                c2.full_name AS customer_name,
                s.title AS service_title
         FROM bookings b
         JOIN tenants t ON t.tenant_id = b.tenant_id
         LEFT JOIN customers c2 ON c2.id = b.customer_id
         LEFT JOIN services s ON s.id = b.service_id
         ${where}
         ORDER BY b.created_at DESC
         LIMIT $1`,
        params
      );
      return { data: rows };
    });
  });

  // ----- cross-tenant audit logs -----
  app.get('/audit-logs', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);

    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT a.id, a.tenant_id, a.actor_id, a.entity_type, a.entity_id, a.action,
                a.created_at, t.business_name, t.subdomain, u.email AS actor_email
         FROM audit_logs a
         JOIN tenants t ON t.tenant_id = a.tenant_id
         LEFT JOIN users u ON u.id = a.actor_id
         WHERE t.subdomain != '__platform__'
         ORDER BY a.created_at DESC
         LIMIT $1`,
        [limit]
      );
      return { data: rows };
    });
  });

  // ----- subscription plans (read + write) -----
  app.get('/plans', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT p.*,
                (SELECT COUNT(*)::int FROM tenants t WHERE t.plan_tier = p.name AND t.subdomain != '__platform__')
                  AS tenant_count
         FROM subscription_plans p ORDER BY price_monthly ASC`
      );
      return { data: rows };
    });
  });

  app.patch('/plans/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { price_monthly, features, resource_limits } = req.body || {};
    const updates = [];
    const params = [];
    if (typeof price_monthly === 'number') { params.push(price_monthly); updates.push(`price_monthly = $${params.length}`); }
    if (features) { params.push(JSON.stringify(features)); updates.push(`features = $${params.length}::jsonb`); }
    if (resource_limits) { params.push(JSON.stringify(resource_limits)); updates.push(`resource_limits = $${params.length}::jsonb`); }
    if (!updates.length) { reply.code(400); return { error: 'no updates' }; }
    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `UPDATE subscription_plans SET ${updates.join(', ')}, updated_at = NOW()
         WHERE id = $${params.length} RETURNING *`,
        params
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // ----- feature flags (read + write) -----
  app.get('/feature-flags', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT f.*, t.business_name, t.subdomain
         FROM feature_flags f
         LEFT JOIN tenants t ON t.tenant_id = f.tenant_id
         ORDER BY f.tenant_id NULLS FIRST, f.flag_key`
      );
      return { data: rows };
    });
  });

  app.post('/feature-flags', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { tenant_id, flag_key, is_enabled, config } = req.body || {};
    if (!flag_key) { reply.code(400); return { error: 'flag_key required' }; }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `INSERT INTO feature_flags (tenant_id, flag_key, is_enabled, config)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, flag_key) DO UPDATE
         SET is_enabled = EXCLUDED.is_enabled, config = EXCLUDED.config, updated_at = NOW()
         RETURNING *`,
        [tenant_id || null, flag_key, is_enabled ?? false, JSON.stringify(config || {})]
      )
    );
    return rows[0];
  });

  app.patch('/feature-flags/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { is_enabled } = req.body || {};
    if (typeof is_enabled !== 'boolean') { reply.code(400); return { error: 'is_enabled required' }; }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `UPDATE feature_flags SET is_enabled = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [is_enabled, req.params.id]
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // ----- charts: tenant signups + bookings over last 30 days (for overview) -----
  app.get('/charts/timeseries', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const days = Math.min(parseInt(req.query.days || '30', 10), 365);

    return db.withSuperAdmin(async (c) => {
      const [signups, bookings] = await Promise.all([
        c.query(
          `SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(COUNT(t.tenant_id), 0)::int AS n
           FROM generate_series(CURRENT_DATE - ($1 - 1) * INTERVAL '1 day', CURRENT_DATE, '1 day') d
           LEFT JOIN tenants t ON t.created_at::date = d::date AND t.subdomain != '__platform__'
           GROUP BY d ORDER BY d`,
          [days]
        ),
        c.query(
          `SELECT to_char(d, 'YYYY-MM-DD') AS day, COALESCE(COUNT(b.id), 0)::int AS n
           FROM generate_series(CURRENT_DATE - ($1 - 1) * INTERVAL '1 day', CURRENT_DATE, '1 day') d
           LEFT JOIN bookings b ON b.created_at::date = d::date
           GROUP BY d ORDER BY d`,
          [days]
        ),
      ]);
      return { signups: signups.rows, bookings: bookings.rows };
    });
  });
};

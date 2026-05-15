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

  // ----- toggle tenant active state -----
  app.patch('/tenants/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { is_active } = req.body || {};
    if (typeof is_active !== 'boolean') {
      reply.code(400);
      return { error: 'is_active boolean required' };
    }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `UPDATE tenants SET is_active = $1, updated_at = NOW()
         WHERE tenant_id = $2 AND subdomain != '__platform__' RETURNING tenant_id, is_active`,
        [is_active, req.params.id]
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'tenant not found' }; }
    return rows[0];
  });
};

/**
 * Login, refresh, and "me". Login requires the resolved tenant (subdomain or
 * x-tenant-id) so credentials never collide across businesses.
 */
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { db, cache, jwt: jwtUtil } = require('@hs/shared');

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

async function resolveTenantId(req) {
  if (req.headers['x-tenant-id']) return req.headers['x-tenant-id'];
  const host = (req.headers.host || '').split(':')[0];
  const base = (process.env.APP_BASE_DOMAIN || 'localhost').split(':')[0];
  const subdomain = host.endsWith(`.${base}`) ? host.slice(0, -base.length - 1) : null;
  if (!subdomain) return null;

  const cached = await cache.getJSON(cache.globalKey('tenant', 'sub', subdomain));
  if (cached) return cached.tenant_id;

  const { rows } = await db.withSuperAdmin((c) =>
    c.query('SELECT tenant_id FROM tenants WHERE subdomain=$1 AND is_active=true', [subdomain])
  );
  return rows[0]?.tenant_id || null;
}

module.exports = async function (app) {
  // ===== Super admin login — no tenant context required =====
  app.post('/admin-login', async (req, reply) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid input', details: parsed.error.flatten() };
    }
    const { email, password } = parsed.data;

    const user = await db.withSuperAdmin(async (client) => {
      const { rows } = await client.query(
        `SELECT id, tenant_id, email, password_hash, role, full_name, is_active
         FROM users WHERE email = $1 AND role = 'super_admin' LIMIT 1`,
        [email]
      );
      return rows[0];
    });

    if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
      reply.code(401);
      return { error: 'invalid credentials' };
    }

    const accessToken = jwtUtil.signAccess({
      sub: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role,
      isSuperAdmin: true,
    });

    return {
      accessToken,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    };
  });

  app.post('/login', async (req, reply) => {
    const tenantId = await resolveTenantId(req);
    if (!tenantId) {
      reply.code(400);
      return { error: 'unable to resolve tenant' };
    }

    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid input', details: parsed.error.flatten() };
    }
    const { email, password } = parsed.data;

    const user = await db.withTenant(tenantId, async (client) => {
      const { rows } = await client.query(
        `SELECT id, email, password_hash, role, full_name, is_active
         FROM users WHERE email=$1 LIMIT 1`,
        [email]
      );
      return rows[0];
    });

    if (!user || !user.is_active || !bcrypt.compareSync(password, user.password_hash)) {
      reply.code(401);
      return { error: 'invalid credentials' };
    }

    const accessToken = jwtUtil.signAccess({
      sub: user.id,
      tenantId,
      email: user.email,
      role: user.role,
    });
    const refreshToken = jwtUtil.signRefresh({ sub: user.id, tenantId });

    // Best-effort: record last_login
    db.withTenant(tenantId, (c) =>
      c.query('UPDATE users SET last_login_at = NOW() WHERE id=$1', [user.id])
    ).catch(() => {});

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    };
  });

  app.post('/refresh', async (req, reply) => {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      reply.code(400);
      return { error: 'refreshToken required' };
    }
    try {
      const payload = jwtUtil.verify(refreshToken);
      if (payload.type !== 'refresh') throw new Error('not a refresh token');

      const user = await db.withTenant(payload.tenantId, async (c) => {
        const { rows } = await c.query(
          'SELECT id, email, role, is_active FROM users WHERE id=$1',
          [payload.sub]
        );
        return rows[0];
      });
      if (!user || !user.is_active) {
        reply.code(401);
        return { error: 'user inactive' };
      }
      return {
        accessToken: jwtUtil.signAccess({
          sub: user.id,
          tenantId: payload.tenantId,
          email: user.email,
          role: user.role,
        }),
      };
    } catch {
      reply.code(401);
      return { error: 'invalid refresh token' };
    }
  });

  app.get('/me', async (req, reply) => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      reply.code(401);
      return { error: 'missing token' };
    }
    try {
      const payload = jwtUtil.verify(auth.slice(7));
      return { user: payload };
    } catch {
      reply.code(401);
      return { error: 'invalid token' };
    }
  });
};

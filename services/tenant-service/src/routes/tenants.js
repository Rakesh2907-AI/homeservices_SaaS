/**
 * Tenant lifecycle endpoints — used by the SaaS signup flow and the super-admin
 * console. All writes happen with super-admin context so the `tenants` row
 * exists before any RLS-protected child rows are created.
 */
const { z } = require('zod');
const bcrypt = require('bcryptjs');
const { db, cache, logger } = require('@hs/shared');

const signupSchema = z.object({
  business_name: z.string().min(2).max(255),
  subdomain: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/, 'lowercase alnum + hyphens'),
  admin_email: z.string().email(),
  admin_password: z.string().min(8),
  admin_full_name: z.string().min(2),
  plan_tier: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  theme_config: z.record(z.any()).optional(),
});

module.exports = async function (app) {
  // ===== Public: signup new tenant =====
  app.post('/signup', async (req, reply) => {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'Invalid input', details: parsed.error.flatten() };
    }
    const input = parsed.data;

    try {
      const result = await db.withSuperAdmin(async (client) => {
        // Reserve subdomain
        const dupe = await client.query('SELECT 1 FROM tenants WHERE subdomain=$1', [input.subdomain]);
        if (dupe.rowCount) {
          throw Object.assign(new Error('subdomain_taken'), { status: 409 });
        }

        const tenantInsert = await client.query(
          `INSERT INTO tenants (business_name, subdomain, plan_tier, theme_config)
           VALUES ($1, $2, $3, $4)
           RETURNING tenant_id, business_name, subdomain, plan_tier, theme_config`,
          [
            input.business_name,
            input.subdomain,
            input.plan_tier,
            JSON.stringify(input.theme_config || { primary_color: '#0044cc' }),
          ]
        );
        const tenant = tenantInsert.rows[0];

        const passwordHash = bcrypt.hashSync(input.admin_password, 10);
        await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
           VALUES ($1, $2, $3, $4, 'business_admin')`,
          [tenant.tenant_id, input.admin_email, passwordHash, input.admin_full_name]
        );

        return tenant;
      });

      // TODO: enqueue Terraform run for K8s namespace + S3 bucket here.
      logger.info({ tenantId: result.tenant_id }, 'tenant signed up');

      reply.code(201);
      return result;
    } catch (err) {
      if (err.status === 409) {
        reply.code(409);
        return { error: 'Subdomain already taken' };
      }
      throw err;
    }
  });

  // ===== Public: resolve tenant by host (used by frontend bootstrap) =====
  app.get('/resolve', async (req, reply) => {
    // Behind the gateway, x-tenant-id is already injected after host resolution.
    if (req.headers['x-tenant-id']) {
      const tenantId = req.headers['x-tenant-id'];
      return cache.remember(cache.key(tenantId, 'public'), 300, async () => {
        const { rows } = await db.withSuperAdmin((c) =>
          c.query(
            `SELECT tenant_id, business_name, subdomain, custom_domain, plan_tier,
                    logo_url, theme_config
             FROM tenants WHERE tenant_id=$1 AND is_active=true`,
            [tenantId]
          )
        );
        if (!rows[0]) { reply.code(404); return null; }
        return rows[0];
      });
    }

    const host = (req.query.host || req.headers.host || '').split(':')[0];
    if (!host) {
      reply.code(400);
      return { error: 'host required' };
    }
    const base = (process.env.APP_BASE_DOMAIN || 'localhost').split(':')[0];
    const subdomain = host.endsWith(`.${base}`) ? host.slice(0, -base.length - 1) : null;

    const cacheKey = cache.globalKey('tenant', subdomain ? 'sub' : 'domain', subdomain || host);
    const tenant = await cache.remember(cacheKey, 300, async () => {
      const { rows } = await db.withSuperAdmin((c) =>
        c.query(
          `SELECT tenant_id, business_name, subdomain, custom_domain, plan_tier,
                  logo_url, theme_config
           FROM tenants
           WHERE (subdomain = $1 OR custom_domain = $2) AND is_active = true
           LIMIT 1`,
          [subdomain, host]
        )
      );
      return rows[0] || null;
    });

    if (!tenant) {
      reply.code(404);
      return { error: 'tenant not found' };
    }
    return tenant;
  });

  // ===== Authenticated: get current tenant =====
  app.get('/me', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      reply.code(400);
      return { error: 'x-tenant-id header required' };
    }
    return cache.remember(cache.key(tenantId, 'config'), 86400, async () => {
      const { rows } = await db.withSuperAdmin((c) =>
        c.query('SELECT * FROM tenants WHERE tenant_id=$1', [tenantId])
      );
      if (!rows[0]) {
        reply.code(404);
        return null;
      }
      return rows[0];
    });
  });
};

/**
 * Theme / white-label endpoints. Themes are stored in `tenants.theme_config`
 * (JSONB) and consumed by the frontend as CSS variables — no redeploy needed.
 */
const { z } = require('zod');
const { db, cache } = require('@hs/shared');

const themeSchema = z.object({
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
  font_family: z.string().optional(),
  logo_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  custom_css: z.string().max(10_000).optional(),
});

module.exports = async function (app) {
  // GET /api/v1/themes — fetch current tenant theme (cached)
  app.get('/', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      reply.code(400);
      return { error: 'x-tenant-id required' };
    }

    return cache.remember(cache.key(tenantId, 'theme'), 3600, async () => {
      const { rows } = await db.withTenant(tenantId, (c) =>
        c.query('SELECT theme_config, logo_url FROM tenants WHERE tenant_id=$1', [tenantId])
      );
      const row = rows[0];
      return row ? { ...row.theme_config, logo_url: row.logo_url } : {};
    });
  });

  // PUT /api/v1/themes — update theme (business_admin only)
  app.put('/', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    const role = req.headers['x-user-role']; // injected by gateway from JWT
    if (!tenantId) {
      reply.code(400);
      return { error: 'x-tenant-id required' };
    }
    if (role !== 'business_admin' && role !== 'super_admin') {
      reply.code(403);
      return { error: 'business_admin role required' };
    }

    const parsed = themeSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid theme', details: parsed.error.flatten() };
    }

    const updated = await db.withTenant(tenantId, async (client) => {
      const { rows } = await client.query(
        `UPDATE tenants
         SET theme_config = theme_config || $1::jsonb,
             logo_url = COALESCE($2, logo_url),
             updated_at = NOW()
         WHERE tenant_id = $3
         RETURNING theme_config, logo_url`,
        [JSON.stringify(parsed.data), parsed.data.logo_url || null, tenantId]
      );
      return rows[0];
    });

    // Invalidate cached theme + tenant config so next request reloads.
    await Promise.all([
      cache.redis.del(cache.key(tenantId, 'theme')),
      cache.redis.del(cache.key(tenantId, 'config')),
    ]);

    return { ...updated.theme_config, logo_url: updated.logo_url };
  });
};

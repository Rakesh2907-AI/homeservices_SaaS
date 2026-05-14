const { z } = require('zod');
const { db, cache } = require('@hs/shared');

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parent_category_id: z.string().uuid().nullable().optional(),
  sort_order: z.number().int().optional(),
  icon_url: z.string().url().optional(),
});

module.exports = async function (app) {
  app.get('/', async (req) =>
    cache.remember(cache.key(req.tenantId, 'categories'), 1800, async () =>
      db.withTenant(req.tenantId, async (c) => {
        const { rows } = await c.query(
          `SELECT id, name, description, parent_category_id, icon_url, sort_order
           FROM service_categories WHERE is_active = true
           ORDER BY parent_category_id NULLS FIRST, sort_order, name`
        );
        return { data: rows };
      }, { readOnly: true })
    )
  );

  app.post('/', async (req, reply) => {
    if (req.user.role !== 'business_admin' && req.user.role !== 'super_admin') {
      reply.code(403); return { error: 'business_admin role required' };
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }
    const d = parsed.data;
    const { rows } = await db.withTenant(req.tenantId, (c) =>
      c.query(
        `INSERT INTO service_categories (tenant_id, name, description, parent_category_id, icon_url, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [req.tenantId, d.name, d.description || null, d.parent_category_id || null, d.icon_url || null, d.sort_order || 0]
      )
    );
    await cache.redis.del(cache.key(req.tenantId, 'categories'));
    reply.code(201);
    return rows[0];
  });
};

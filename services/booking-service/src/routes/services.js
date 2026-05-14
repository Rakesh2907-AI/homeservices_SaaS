const { z } = require('zod');
const { db, cache } = require('@hs/shared');

const schema = z.object({
  category_id: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  base_price: z.number().nonnegative().optional(),
  duration_mins: z.number().int().positive().optional(),
  metadata: z.record(z.any()).optional(),
});

module.exports = async function (app) {
  app.get('/', async (req) => {
    const categoryId = req.query.category_id;
    const cacheKey = cache.key(req.tenantId, 'services', categoryId || 'all');

    return cache.remember(cacheKey, 600, async () => {
      return db.withTenant(req.tenantId, async (c) => {
        const params = [];
        let where = 'WHERE is_active = true';
        if (categoryId) { params.push(categoryId); where += ` AND category_id = $${params.length}`; }
        const { rows } = await c.query(
          `SELECT id, category_id, title, description, base_price, duration_mins, metadata
           FROM services ${where} ORDER BY title`,
          params
        );
        return { data: rows };
      }, { readOnly: true });
    });
  });

  app.post('/', async (req, reply) => {
    if (req.user.role !== 'business_admin' && req.user.role !== 'super_admin') {
      reply.code(403); return { error: 'business_admin role required' };
    }
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }
    const d = parsed.data;
    const { rows } = await db.withTenant(req.tenantId, (c) =>
      c.query(
        `INSERT INTO services (tenant_id, category_id, title, description, base_price, duration_mins, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [req.tenantId, d.category_id, d.title, d.description || null, d.base_price || null, d.duration_mins || null, JSON.stringify(d.metadata || {})]
      )
    );
    await cache.invalidateTenant(req.tenantId);
    reply.code(201);
    return rows[0];
  });
};

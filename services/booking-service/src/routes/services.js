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

  // Bulk-create services (with optional pricing rules per service).
  app.post('/bulk', async (req, reply) => {
    if (req.user.role !== 'business_admin' && req.user.role !== 'super_admin') {
      reply.code(403); return { error: 'business_admin role required' };
    }
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) { reply.code(400); return { error: 'items[] required' }; }

    const out = await db.withTenant(req.tenantId, async (c) => {
      const created = [];
      for (const item of items) {
        const { rows } = await c.query(
          `INSERT INTO services (tenant_id, category_id, title, description, base_price, duration_mins, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [req.tenantId, item.category_id, item.title, item.description || null,
           item.base_price ?? null, item.duration_mins ?? null, JSON.stringify(item.metadata || {})]
        );
        const svc = rows[0];

        if (Array.isArray(item.pricing_rules)) {
          for (const r of item.pricing_rules) {
            await c.query(
              `INSERT INTO pricing_structures (tenant_id, service_id, rule_type, rate, config)
               VALUES ($1,$2,$3,$4,$5)`,
              [req.tenantId, svc.id, r.rule_type, r.rate, JSON.stringify(r.config || {})]
            );
          }
        }
        created.push(svc);
      }
      return created;
    });

    await cache.invalidateTenant(req.tenantId);
    reply.code(201);
    return { data: out };
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

/**
 * Commission CRUD. Each commission has a scope (`applies_to`) and an optional
 * `target_id` (e.g. a category or service). The pricing engine consumes these
 * at quote time.
 */
const { z } = require('zod');
const { db } = require('@hs/shared');

const schema = z.object({
  name: z.string().min(2).max(100),
  applies_to: z.enum(['platform', 'staff', 'category', 'service']),
  target_id: z.string().uuid().nullable().optional(),
  rate_type: z.enum(['percent', 'flat']),
  rate_value: z.number().nonnegative(),
  min_amount: z.number().nonnegative().optional(),
  max_amount: z.number().nonnegative().optional(),
  metadata: z.record(z.any()).optional(),
});

module.exports = async function (app) {
  app.get('/', async (req) => {
    return db.withTenant(req.tenantId, async (c) => {
      const { rows } = await c.query(
        `SELECT id, name, applies_to, target_id, rate_type, rate_value,
                min_amount, max_amount, is_active, metadata, created_at
         FROM commission_structures
         WHERE is_active = true
         ORDER BY applies_to, name`
      );
      return { data: rows };
    }, { readOnly: true });
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
        `INSERT INTO commission_structures
           (tenant_id, name, applies_to, target_id, rate_type, rate_value,
            min_amount, max_amount, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [req.tenantId, d.name, d.applies_to, d.target_id || null, d.rate_type, d.rate_value,
         d.min_amount ?? null, d.max_amount ?? null, JSON.stringify(d.metadata || {})]
      )
    );
    reply.code(201);
    return rows[0];
  });

  app.post('/bulk', async (req, reply) => {
    if (req.user.role !== 'business_admin' && req.user.role !== 'super_admin') {
      reply.code(403); return { error: 'business_admin role required' };
    }
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!items.length) { reply.code(400); return { error: 'items[] required' }; }

    const created = await db.withTenant(req.tenantId, async (c) => {
      const out = [];
      for (const item of items) {
        const parsed = schema.safeParse(item);
        if (!parsed.success) continue;
        const d = parsed.data;
        const { rows } = await c.query(
          `INSERT INTO commission_structures
             (tenant_id, name, applies_to, target_id, rate_type, rate_value,
              min_amount, max_amount, metadata)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
          [req.tenantId, d.name, d.applies_to, d.target_id || null, d.rate_type, d.rate_value,
           d.min_amount ?? null, d.max_amount ?? null, JSON.stringify(d.metadata || {})]
        );
        out.push(rows[0]);
      }
      return out;
    });

    reply.code(201);
    return { data: created };
  });

  app.delete('/:id', async (req, reply) => {
    const result = await db.withTenant(req.tenantId, async (c) => {
      const { rows } = await c.query(
        `UPDATE commission_structures SET is_active=false, updated_at=NOW()
         WHERE id=$1 RETURNING id`,
        [req.params.id]
      );
      return rows[0];
    });
    if (!result) { reply.code(404); return { error: 'not found' }; }
    return { id: result.id, is_active: false };
  });
};

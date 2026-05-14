const { z } = require('zod');
const { db } = require('@hs/shared');

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.record(z.any()).optional(),
});

module.exports = async function (app) {
  app.get('/', async (req) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    return db.withTenant(req.tenantId, async (c) => {
      const { rows } = await c.query(
        'SELECT id, full_name, email, phone, address, created_at FROM customers ORDER BY created_at DESC LIMIT $1',
        [limit]
      );
      return { data: rows };
    }, { readOnly: true });
  });

  app.post('/', async (req, reply) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }
    const d = parsed.data;
    const { rows } = await db.withTenant(req.tenantId, (c) =>
      c.query(
        `INSERT INTO customers (tenant_id, full_name, email, phone, address)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [req.tenantId, d.full_name, d.email || null, d.phone || null, JSON.stringify(d.address || {})]
      )
    );
    reply.code(201);
    return rows[0];
  });
};

/**
 * Bookings CRUD. All queries run via `db.withTenant(...)` so RLS enforces
 * isolation regardless of any developer-side filter mistakes.
 */
const { z } = require('zod');
const { db } = require('@hs/shared');

const createSchema = z.object({
  customer_id: z.string().uuid(),
  service_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  assigned_staff: z.string().uuid().optional(),
  quoted_price: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

const updateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduled_at: z.string().datetime().optional(),
  assigned_staff: z.string().uuid().nullable().optional(),
  quoted_price: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

module.exports = async function (app) {
  // List bookings (paginated)
  app.get('/', async (req) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    const offset = parseInt(req.query.offset || '0', 10);
    const status = req.query.status;

    return db.withTenant(req.tenantId, async (c) => {
      const params = [limit, offset];
      let where = '';
      if (status) { params.push(status); where = `WHERE status = $${params.length}`; }

      const { rows } = await c.query(
        `SELECT id, customer_id, service_id, assigned_staff, scheduled_at,
                status, quoted_price, notes, created_at
         FROM bookings ${where}
         ORDER BY scheduled_at DESC
         LIMIT $1 OFFSET $2`,
        params
      );
      return { data: rows, limit, offset };
    }, { readOnly: true });
  });

  // Get single booking
  app.get('/:id', async (req, reply) => {
    const { rows } = await db.withTenant(req.tenantId, (c) =>
      c.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]),
    { readOnly: true });
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // Create booking
  app.post('/', async (req, reply) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }
    const b = parsed.data;

    const result = await db.withTenant(req.tenantId, async (c) => {
      const { rows } = await c.query(
        `INSERT INTO bookings (tenant_id, customer_id, service_id, assigned_staff, scheduled_at, quoted_price, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.tenantId, b.customer_id, b.service_id, b.assigned_staff || null, b.scheduled_at, b.quoted_price || null, b.notes || null]
      );

      await c.query(
        `INSERT INTO audit_logs (tenant_id, actor_id, entity_type, entity_id, action, new_value)
         VALUES ($1, $2, 'booking', $3, 'CREATE', $4)`,
        [req.tenantId, req.user.sub, rows[0].id, JSON.stringify(rows[0])]
      );

      return rows[0];
    });

    reply.code(201);
    return result;
  });

  // Update booking
  app.patch('/:id', async (req, reply) => {
    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }

    const fields = Object.entries(parsed.data);
    if (!fields.length) { reply.code(400); return { error: 'no fields to update' }; }

    const setClauses = fields.map(([k], i) => `${k} = $${i + 2}`).join(', ');
    const values = fields.map(([, v]) => v);

    const result = await db.withTenant(req.tenantId, async (c) => {
      const before = await c.query('SELECT * FROM bookings WHERE id=$1', [req.params.id]);
      if (!before.rowCount) return null;

      const { rows } = await c.query(
        `UPDATE bookings SET ${setClauses}, updated_at = NOW() WHERE id = $1 RETURNING *`,
        [req.params.id, ...values]
      );

      await c.query(
        `INSERT INTO audit_logs (tenant_id, actor_id, entity_type, entity_id, action, old_value, new_value)
         VALUES ($1, $2, 'booking', $3, 'UPDATE', $4, $5)`,
        [req.tenantId, req.user.sub, req.params.id, JSON.stringify(before.rows[0]), JSON.stringify(rows[0])]
      );

      return rows[0];
    });

    if (!result) { reply.code(404); return { error: 'not found' }; }
    return result;
  });

  // Cancel booking (soft delete via status)
  app.delete('/:id', async (req, reply) => {
    const result = await db.withTenant(req.tenantId, async (c) => {
      const { rows } = await c.query(
        `UPDATE bookings SET status='cancelled', updated_at=NOW()
         WHERE id=$1 RETURNING id`,
        [req.params.id]
      );
      return rows[0];
    });
    if (!result) { reply.code(404); return { error: 'not found' }; }
    return { id: result.id, status: 'cancelled' };
  });
};

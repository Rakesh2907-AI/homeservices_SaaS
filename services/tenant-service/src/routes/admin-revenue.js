/**
 * Revenue, billing, taxes, discounts, notifications — super-admin only.
 * Uses the same JWT super_admin gate as the other admin routes.
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
  // ===== SUBSCRIPTIONS =====
  app.get('/subscriptions', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT s.*,
                t.business_name, t.subdomain, t.logo_url,
                p.name AS plan_name, p.price_monthly
         FROM subscriptions s
         JOIN tenants t ON t.tenant_id = s.tenant_id
         JOIN subscription_plans p ON p.id = s.plan_id
         WHERE t.subdomain != '__platform__'
         ORDER BY s.mrr_cents DESC, s.created_at DESC`
      );
      return { data: rows };
    });
  });

  app.patch('/subscriptions/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { status, cancel_reason } = req.body || {};
    const updates = [];
    const params = [];
    if (status) { params.push(status); updates.push(`status = $${params.length}`); }
    if (cancel_reason) { params.push(cancel_reason); updates.push(`cancel_reason = $${params.length}`); }
    if (status === 'canceled') updates.push(`canceled_at = NOW()`);
    if (!updates.length) { reply.code(400); return { error: 'no updates' }; }
    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE subscriptions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`, params)
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // ===== INVOICES =====
  app.get('/invoices', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const status = req.query.status;
    const tenantId = req.query.tenant_id;

    return db.withSuperAdmin(async (c) => {
      const params = [];
      const wheres = ["t.subdomain != '__platform__'"];
      if (status) { params.push(status); wheres.push(`i.status = $${params.length}`); }
      if (tenantId) { params.push(tenantId); wheres.push(`i.tenant_id = $${params.length}`); }
      const { rows } = await c.query(
        `SELECT i.*, t.business_name, t.subdomain
         FROM invoices i
         JOIN tenants t ON t.tenant_id = i.tenant_id
         WHERE ${wheres.join(' AND ')}
         ORDER BY i.issued_at DESC
         LIMIT 200`,
        params
      );
      return { data: rows };
    });
  });

  app.patch('/invoices/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { status } = req.body || {};
    if (!status) { reply.code(400); return { error: 'status required' }; }
    const sets = ['status = $1', 'updated_at = NOW()'];
    const params = [status];
    if (status === 'paid') sets.push('paid_at = NOW()');
    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE invoices SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`, params)
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // ===== TAX RATES =====
  app.get('/tax-rates', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query('SELECT * FROM tax_rates ORDER BY country, region NULLS FIRST, name');
      return { data: rows };
    });
  });

  app.post('/tax-rates', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const b = req.body || {};
    if (!b.name || b.rate == null || !b.country) { reply.code(400); return { error: 'name, rate, country required' }; }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `INSERT INTO tax_rates (name, rate, country, region, postal_code_prefix, category, inclusive, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [b.name, b.rate, b.country, b.region || null, b.postal_code_prefix || null, b.category || 'service', !!b.inclusive, b.is_active ?? true]
      )
    );
    reply.code(201); return rows[0];
  });

  app.patch('/tax-rates/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const b = req.body || {};
    const allowed = ['name', 'rate', 'country', 'region', 'postal_code_prefix', 'category', 'inclusive', 'is_active'];
    const sets = [];
    const params = [];
    for (const f of allowed) {
      if (b[f] !== undefined) { params.push(b[f]); sets.push(`${f} = $${params.length}`); }
    }
    if (!sets.length) { reply.code(400); return { error: 'no updates' }; }
    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE tax_rates SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`, params)
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  app.delete('/tax-rates/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    await db.withSuperAdmin((c) => c.query('DELETE FROM tax_rates WHERE id = $1', [req.params.id]));
    reply.code(204).send();
  });

  // ===== DISCOUNT CODES =====
  app.get('/discount-codes', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query('SELECT * FROM discount_codes ORDER BY created_at DESC');
      return { data: rows };
    });
  });

  app.post('/discount-codes', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const b = req.body || {};
    if (!b.code || !b.name || !b.discount_type || b.discount_value == null) {
      reply.code(400); return { error: 'code, name, discount_type, discount_value required' };
    }
    try {
      const { rows } = await db.withSuperAdmin((c) =>
        c.query(
          `INSERT INTO discount_codes (code, name, discount_type, discount_value, scope, scope_target,
                                        max_uses, valid_from, valid_until, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
          [b.code.toUpperCase(), b.name, b.discount_type, b.discount_value, b.scope || 'all',
           JSON.stringify(b.scope_target || []), b.max_uses || null, b.valid_from || new Date(),
           b.valid_until || null, b.is_active ?? true]
        )
      );
      reply.code(201); return rows[0];
    } catch (err) {
      reply.code(400); return { error: err.message };
    }
  });

  app.patch('/discount-codes/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const b = req.body || {};
    const allowed = ['name', 'discount_type', 'discount_value', 'scope', 'scope_target', 'max_uses', 'valid_until', 'is_active'];
    const sets = [];
    const params = [];
    for (const f of allowed) {
      if (b[f] !== undefined) {
        const v = typeof b[f] === 'object' && b[f] !== null ? JSON.stringify(b[f]) : b[f];
        params.push(v); sets.push(`${f} = $${params.length}`);
      }
    }
    if (!sets.length) { reply.code(400); return { error: 'no updates' }; }
    params.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE discount_codes SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`, params)
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  app.delete('/discount-codes/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    await db.withSuperAdmin((c) => c.query('DELETE FROM discount_codes WHERE id = $1', [req.params.id]));
    reply.code(204).send();
  });

  // ===== ADMIN NOTIFICATIONS =====
  app.get('/notifications', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT n.*, t.business_name, t.subdomain
         FROM admin_notifications n
         LEFT JOIN tenants t ON t.tenant_id = n.tenant_id
         ORDER BY n.created_at DESC LIMIT 200`
      );
      return { data: rows };
    });
  });

  app.get('/notifications/unread-count', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query('SELECT COUNT(*)::int AS n FROM admin_notifications WHERE is_read = false');
      return { count: rows[0].n };
    });
  });

  app.patch('/notifications/:id/read', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    await db.withSuperAdmin((c) =>
      c.query(`UPDATE admin_notifications SET is_read = true, read_at = NOW() WHERE id = $1`, [req.params.id])
    );
    reply.code(204).send();
  });

  app.patch('/notifications/mark-all-read', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { rowCount } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE admin_notifications SET is_read = true, read_at = NOW() WHERE is_read = false`)
    );
    return { updated: rowCount };
  });

  // ===== REVENUE ANALYTICS =====
  app.get('/revenue/summary', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const mrr = await c.query(
        `SELECT COALESCE(SUM(mrr_cents), 0)::int AS cents,
                COUNT(*)::int AS active_subs
         FROM subscriptions WHERE status IN ('active','trialing')`
      );
      const planMix = await c.query(
        `SELECT p.name AS plan_name, COUNT(s.id)::int AS subs, COALESCE(SUM(s.mrr_cents), 0)::int AS mrr_cents
         FROM subscriptions s
         JOIN subscription_plans p ON p.id = s.plan_id
         WHERE s.status IN ('active','trialing')
         GROUP BY p.name ORDER BY mrr_cents DESC`
      );
      const billed = await c.query(
        `SELECT COALESCE(SUM(total_cents), 0)::int AS cents
         FROM invoices WHERE status = 'paid' AND paid_at >= NOW() - INTERVAL '30 days'`
      );
      const outstanding = await c.query(
        `SELECT COALESCE(SUM(total_cents), 0)::int AS cents, COUNT(*)::int AS n
         FROM invoices WHERE status IN ('sent','overdue')`
      );
      const churn = await c.query(
        `SELECT COUNT(*)::int AS canceled_30d
         FROM subscriptions WHERE canceled_at >= NOW() - INTERVAL '30 days'`
      );

      const mrrCents = mrr.rows[0].cents;
      const activeSubs = mrr.rows[0].active_subs;
      return {
        mrr_cents: mrrCents,
        arr_cents: mrrCents * 12,
        active_subscriptions: activeSubs,
        arpu_cents: activeSubs > 0 ? Math.round(mrrCents / activeSubs) : 0,
        billed_30d_cents: billed.rows[0].cents,
        outstanding_cents: outstanding.rows[0].cents,
        outstanding_count: outstanding.rows[0].n,
        canceled_30d: churn.rows[0].canceled_30d,
        churn_rate_pct: activeSubs > 0 ? Math.round((churn.rows[0].canceled_30d / activeSubs) * 10000) / 100 : 0,
        plan_mix: planMix.rows,
      };
    });
  });

  app.get('/revenue/timeseries', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const months = Math.min(parseInt(req.query.months || '6', 10), 24);

    return db.withSuperAdmin(async (c) => {
      const billings = await c.query(
        `SELECT to_char(date_trunc('month', d), 'YYYY-MM') AS month,
                COALESCE(SUM(CASE WHEN i.status = 'paid' THEN i.total_cents ELSE 0 END), 0)::int AS billed_cents,
                COALESCE(SUM(CASE WHEN i.status IN ('sent','overdue') THEN i.total_cents ELSE 0 END), 0)::int AS pending_cents,
                COUNT(i.id)::int AS invoices
         FROM generate_series(
                date_trunc('month', NOW()) - ($1 - 1) * INTERVAL '1 month',
                date_trunc('month', NOW()),
                '1 month') d
         LEFT JOIN invoices i ON date_trunc('month', i.issued_at) = d
         GROUP BY d ORDER BY d`,
        [months]
      );
      return { data: billings.rows };
    });
  });
};

/**
 * Public (no-auth) tenant endpoints — consumed by the customer-facing portal.
 * Every endpoint accepts a `:slug` path param so the customer browser doesn't
 * need to send an auth header. We resolve the tenant from the slug, then run
 * all queries under that tenant's RLS context.
 */
const { z } = require('zod');
const { db, cache } = require('@hs/shared');

const bookingSchema = z.object({
  service_id: z.string().uuid(),
  scheduled_at: z.string().datetime(),
  customer: z.object({
    full_name: z.string().min(2).max(255),
    email: z.string().email().optional(),
    phone: z.string().max(50).optional(),
    address: z.object({
      line1: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
    }).optional(),
  }),
  notes: z.string().max(2000).optional(),
  quoted_price: z.number().nonnegative().optional(),
});

async function resolveTenant(slug) {
  // Use a distinct cache key from the gateway's slim resolver to avoid collisions.
  const cacheKey = cache.globalKey('tenant', 'public', slug);
  return cache.remember(cacheKey, 300, async () => {
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `SELECT tenant_id, business_name, subdomain, custom_domain, plan_tier,
                logo_url, theme_config, business_details, is_active
         FROM tenants WHERE subdomain=$1 AND subdomain != '__platform__'`,
        [slug]
      )
    );
    return rows[0] || null;
  });
}

module.exports = async function (app) {
  // GET /api/v1/public/tenants/:slug — tenant public info (theme, logo, business name)
  app.get('/tenants/:slug', async (req, reply) => {
    const tenant = await resolveTenant(req.params.slug);
    if (!tenant) { reply.code(404); return { error: 'business not found' }; }
    if (!tenant.is_active) { reply.code(403); return { error: 'business is currently unavailable' }; }
    // Expose only the public-safe fields
    return {
      tenant_id: tenant.tenant_id,
      business_name: tenant.business_name,
      subdomain: tenant.subdomain,
      custom_domain: tenant.custom_domain,
      logo_url: tenant.logo_url,
      theme_config: tenant.theme_config,
      business_details: tenant.business_details,
    };
  });

  // GET /api/v1/public/tenants/:slug/categories — visible categories
  app.get('/tenants/:slug/categories', async (req, reply) => {
    const tenant = await resolveTenant(req.params.slug);
    if (!tenant || !tenant.is_active) { reply.code(404); return { error: 'not found' }; }

    return db.withTenant(tenant.tenant_id, async (c) => {
      const { rows } = await c.query(
        `SELECT id, name, description, parent_category_id, icon_url, sort_order
         FROM service_categories WHERE is_active=true
         ORDER BY parent_category_id NULLS FIRST, sort_order, name`
      );
      return { data: rows };
    }, { readOnly: true });
  });

  // GET /api/v1/public/tenants/:slug/services — visible services (with optional ?category=)
  app.get('/tenants/:slug/services', async (req, reply) => {
    const tenant = await resolveTenant(req.params.slug);
    if (!tenant || !tenant.is_active) { reply.code(404); return { error: 'not found' }; }
    const categoryId = req.query.category;

    return db.withTenant(tenant.tenant_id, async (c) => {
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

  // POST /api/v1/public/tenants/:slug/quote — live pricing preview (no booking created)
  app.post('/tenants/:slug/quote', async (req, reply) => {
    const tenant = await resolveTenant(req.params.slug);
    if (!tenant || !tenant.is_active) { reply.code(404); return { error: 'not found' }; }

    const { service_id, context = {}, options = {} } = req.body || {};
    if (!service_id) { reply.code(400); return { error: 'service_id required' }; }

    const { pricing } = require('@hs/shared');

    const data = await db.withTenant(tenant.tenant_id, async (c) => {
      const svc = await c.query('SELECT id, tenant_id, category_id, title, base_price, duration_mins FROM services WHERE id=$1 AND is_active=true', [service_id]);
      if (!svc.rows[0]) return null;
      const rules = await c.query("SELECT id, rule_type, rate, config FROM pricing_structures WHERE service_id=$1 AND (effective_to IS NULL OR effective_to > NOW()) AND effective_from <= NOW()", [service_id]);
      const commissions = await c.query('SELECT id, name, applies_to, target_id, rate_type, rate_value, min_amount, max_amount, is_active FROM commission_structures WHERE is_active=true', []);
      return { service: svc.rows[0], rules: rules.rows, commissions: commissions.rows };
    }, { readOnly: true });

    if (!data) { reply.code(404); return { error: 'service not found' }; }
    const quote = pricing.computeQuote(data.service, data.rules, data.commissions, context, options);
    return { service: { id: data.service.id, title: data.service.title }, quote };
  });

  // POST /api/v1/public/tenants/:slug/bookings — anonymous booking creation
  // Creates the customer record (or matches by email) and the booking in one tx.
  app.post('/tenants/:slug/bookings', async (req, reply) => {
    const tenant = await resolveTenant(req.params.slug);
    if (!tenant || !tenant.is_active) { reply.code(404); return { error: 'not found' }; }

    const parsed = bookingSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid input', details: parsed.error.flatten() };
    }
    const input = parsed.data;

    try {
      const result = await db.withTenant(tenant.tenant_id, async (c) => {
        // Match existing customer by email (case-insensitive) or create new.
        let customerId = null;
        if (input.customer.email) {
          const { rows } = await c.query(
            'SELECT id FROM customers WHERE LOWER(email) = LOWER($1) LIMIT 1',
            [input.customer.email]
          );
          customerId = rows[0]?.id;
        }

        if (!customerId) {
          const { rows } = await c.query(
            `INSERT INTO customers (tenant_id, full_name, email, phone, address)
             VALUES ($1, $2, $3, $4, $5) RETURNING id`,
            [
              tenant.tenant_id,
              input.customer.full_name,
              input.customer.email || null,
              input.customer.phone || null,
              JSON.stringify(input.customer.address || {}),
            ]
          );
          customerId = rows[0].id;
        }

        const { rows: bRows } = await c.query(
          `INSERT INTO bookings (tenant_id, customer_id, service_id, scheduled_at, quoted_price, notes)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [tenant.tenant_id, customerId, input.service_id, input.scheduled_at, input.quoted_price ?? null, input.notes ?? null]
        );

        await c.query(
          `INSERT INTO audit_logs (tenant_id, entity_type, entity_id, action, new_value)
           VALUES ($1, 'booking', $2, 'CREATE', $3)`,
          [tenant.tenant_id, bRows[0].id, JSON.stringify({ ...bRows[0], source: 'public_portal' })]
        );

        return bRows[0];
      });

      reply.code(201);
      return result;
    } catch (err) {
      reply.code(400);
      return { error: err.message };
    }
  });
};

/**
 * Onboarding-wizard endpoints. Each step is idempotent and updates
 * `tenants.onboarding_status` so the frontend can resume mid-wizard.
 */
const { z } = require('zod');
const { db, cache } = require('@hs/shared');
const presets = require('../themes/presets');

const STEPS = ['theme', 'business', 'categories', 'services', 'commissions', 'complete'];

const businessSchema = z.object({
  business_name: z.string().min(2).max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  tax_id: z.string().max(50).optional(),
  address: z.object({
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  hours: z.record(z.any()).optional(), // { mon: "09:00-17:00", ... }
  description: z.string().max(2000).optional(),
});

module.exports = async function (app) {
  // ----- Theme presets list (public, no auth required) -----
  app.get('/presets', async () => ({ data: presets }));

  // ----- Get current tenant onboarding status -----
  app.get('/status', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) { reply.code(400); return { error: 'tenant required' }; }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `SELECT tenant_id, business_name, subdomain, plan_tier, logo_url,
                theme_config, business_details, onboarding_status
         FROM tenants WHERE tenant_id=$1`,
        [tenantId]
      )
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  // ----- Mark a step done (advances current_step automatically) -----
  app.post('/steps/:step/complete', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    const step = req.params.step;
    if (!STEPS.includes(step)) { reply.code(400); return { error: `unknown step: ${step}` }; }

    const nextIdx = STEPS.indexOf(step) + 1;
    const next = STEPS[nextIdx] || 'complete';
    const completed = step === 'complete' || nextIdx === STEPS.length - 1;

    const { rows } = await db.withTenant(tenantId, (c) =>
      c.query(
        `UPDATE tenants
         SET onboarding_status = jsonb_build_object(
           'completed', $1::boolean,
           'current_step', $2::text,
           'steps_done', (
             SELECT to_jsonb(array(
               SELECT DISTINCT v FROM unnest(
                 ARRAY(SELECT jsonb_array_elements_text(onboarding_status->'steps_done'))
                 || ARRAY[$3::text]
               ) v
             ))
           )
         ),
         updated_at = NOW()
         WHERE tenant_id = $4
         RETURNING onboarding_status`,
        [completed, next, step, tenantId]
      )
    );

    await cache.redis.del(cache.key(tenantId, 'config'));
    return rows[0]?.onboarding_status;
  });

  // ----- Update business details -----
  app.put('/business', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    const parsed = businessSchema.safeParse(req.body);
    if (!parsed.success) { reply.code(400); return { error: 'invalid', details: parsed.error.flatten() }; }
    const d = parsed.data;

    const { rows } = await db.withTenant(tenantId, (c) =>
      c.query(
        `UPDATE tenants
         SET business_name = COALESCE($1, business_name),
             business_details = business_details || $2::jsonb,
             updated_at = NOW()
         WHERE tenant_id = $3
         RETURNING business_name, business_details`,
        [d.business_name || null, JSON.stringify(d), tenantId]
      )
    );
    await cache.redis.del(cache.key(tenantId, 'config'));
    return rows[0];
  });
};

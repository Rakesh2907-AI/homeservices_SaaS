/**
 * Quote endpoint — runs the pricing engine and returns a detailed quote
 * without creating a booking. Used by the customer portal for live pricing
 * preview and by the dashboard for "Get quote" flows.
 */
const { z } = require('zod');
const { db, pricing } = require('@hs/shared');

const computeSchema = z.object({
  service_id: z.string().uuid(),
  context: z.object({
    hours: z.number().optional(),
    distance_miles: z.number().optional(),
    sqft: z.number().optional(),
    tier_input: z.number().optional(),
    after_hours: z.boolean().optional(),
    discount_amount: z.number().optional(),
    discount_label: z.string().optional(),
  }).optional(),
  options: z.object({
    tax_rate: z.number().min(0).max(1).optional(),
    currency: z.string().optional(),
  }).optional(),
});

async function loadServiceWithRules(client, serviceId) {
  const [{ rows: svcRows }, { rows: ruleRows }, { rows: comRows }] = await Promise.all([
    client.query('SELECT id, tenant_id, category_id, title, base_price, duration_mins FROM services WHERE id=$1', [serviceId]),
    client.query("SELECT id, rule_type, rate, config FROM pricing_structures WHERE service_id=$1 AND (effective_to IS NULL OR effective_to > NOW()) AND effective_from <= NOW()", [serviceId]),
    client.query('SELECT id, name, applies_to, target_id, rate_type, rate_value, min_amount, max_amount, is_active FROM commission_structures WHERE is_active=true', []),
  ]);
  return { service: svcRows[0], rules: ruleRows, commissions: comRows };
}

module.exports = async function (app) {
  app.post('/compute', async (req, reply) => {
    const parsed = computeSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.code(400);
      return { error: 'invalid input', details: parsed.error.flatten() };
    }
    const { service_id, context = {}, options = {} } = parsed.data;

    const tenantId = req.tenantId;
    if (!tenantId) { reply.code(400); return { error: 'tenant required' }; }

    try {
      const { service, rules, commissions } = await db.withTenant(tenantId, async (c) => loadServiceWithRules(c, service_id), { readOnly: true });
      if (!service) { reply.code(404); return { error: 'service not found' }; }

      const quote = pricing.computeQuote(service, rules, commissions, context, options);
      return {
        service: { id: service.id, title: service.title },
        rules_applied: rules.length,
        commissions_applied: quote.commissions.length,
        quote,
      };
    } catch (err) {
      reply.code(500);
      return { error: err.message };
    }
  });
};

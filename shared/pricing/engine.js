/**
 * Pricing engine. Pure functions — no DB access here. Consumers load the
 * service + pricing rules + commission rules, then call computeQuote().
 *
 * Why pure: every rule type is a (rule, context) → line_item function. Easy to
 * unit-test, easy to reason about, and the same engine runs server-side or
 * (later) client-side for live previews.
 *
 * A *quote* is reproducible: given the same service + rules + context, you
 * always get the same total. Past quotes are stored as snapshots so changing
 * a rate today doesn't retroactively change last week's invoice.
 */

const RULE_TYPES = ['flat', 'hourly', 'distance', 'sqft', 'tiered'];

/**
 * @param {object} service                     { id, title, base_price, duration_mins }
 * @param {object[]} rules                     pricing_structures rows
 * @param {object[]} commissions               commission_structures rows (optional overlay)
 * @param {object} context                     { hours, distance_miles, sqft, after_hours, tier_input }
 * @param {object} options                     { tax_rate, currency, distance_radius_miles }
 * @returns {object} quote                     { line_items, subtotal, taxes, total, commissions }
 */
function computeQuote(service, rules = [], commissions = [], context = {}, options = {}) {
  const currency = options.currency || 'USD';
  const taxRate = typeof options.tax_rate === 'number' ? options.tax_rate : 0;
  const lineItems = [];

  // 1. If we have explicit rules, evaluate them; otherwise fall back to base_price.
  if (rules.length === 0 && service.base_price != null) {
    lineItems.push({
      type: 'base',
      label: service.title || 'Service',
      amount: Number(service.base_price),
    });
  } else {
    for (const rule of rules) {
      const item = applyRule(rule, context, service);
      if (item) lineItems.push(item);
    }
  }

  // 2. After-hours surcharge from context flag.
  if (context.after_hours) {
    const baseTotal = lineItems.reduce((s, it) => s + it.amount, 0);
    const surcharge = Number((baseTotal * 0.5).toFixed(2));
    lineItems.push({ type: 'surcharge', label: 'After-hours (×1.5)', amount: surcharge });
  }

  // 3. Discount (passed in context — e.g. promo codes resolved upstream).
  if (context.discount_amount && Number(context.discount_amount) > 0) {
    lineItems.push({
      type: 'discount',
      label: context.discount_label || 'Discount',
      amount: -Math.abs(Number(context.discount_amount)),
    });
  }

  // 4. Subtotal → taxes → total.
  const subtotal = round2(lineItems.reduce((s, it) => s + it.amount, 0));
  const taxes = round2(subtotal * taxRate);
  const total = round2(subtotal + taxes);

  // 5. Commission breakdown (reportable: who gets what).
  const commissionBreakdown = commissions
    .filter((c) => c.is_active !== false)
    .filter((c) => {
      if (c.applies_to === 'platform' || c.applies_to === 'staff') return true;
      if (c.applies_to === 'category' && c.target_id === service.category_id) return true;
      if (c.applies_to === 'service' && c.target_id === service.id) return true;
      return false;
    })
    .map((c) => {
      const rate = Number(c.rate_value);
      let amount;
      if (c.rate_type === 'percent') amount = round2(total * (rate / 100));
      else amount = rate;
      if (c.min_amount != null) amount = Math.max(amount, Number(c.min_amount));
      if (c.max_amount != null) amount = Math.min(amount, Number(c.max_amount));
      return {
        name: c.name,
        applies_to: c.applies_to,
        rate_type: c.rate_type,
        rate_value: rate,
        amount: round2(amount),
      };
    });

  return {
    currency,
    line_items: lineItems,
    subtotal,
    tax_rate: taxRate,
    taxes,
    total,
    commissions: commissionBreakdown,
    computed_at: new Date().toISOString(),
  };
}

function applyRule(rule, ctx, service) {
  const rate = Number(rule.rate);
  const config = rule.config || {};
  switch (rule.rule_type) {
    case 'flat':
      return { type: 'rule', rule_type: 'flat', label: config.label || service.title || 'Flat fee', amount: rate };

    case 'hourly': {
      const minHours = Number(config.min_hours || 1);
      const maxHours = Number(config.max_hours || Infinity);
      let hours = Number(ctx.hours);
      if (!hours && service.duration_mins) hours = service.duration_mins / 60;
      hours = clamp(hours || minHours, minHours, maxHours);
      return {
        type: 'rule', rule_type: 'hourly',
        label: `${hours.toFixed(2)} hr × $${rate.toFixed(2)}/hr`,
        amount: round2(hours * rate),
      };
    }

    case 'distance': {
      const radius = Number(config.included_radius_miles || ctx.included_radius_miles || 0);
      const miles = Math.max(0, (Number(ctx.distance_miles) || 0) - radius);
      if (miles === 0) return null;
      return {
        type: 'rule', rule_type: 'distance',
        label: `${miles.toFixed(1)} mi × $${rate.toFixed(2)}/mi (outside ${radius}mi)`,
        amount: round2(miles * rate),
      };
    }

    case 'sqft': {
      const sqft = Number(ctx.sqft || 0);
      if (sqft === 0) return null;
      return {
        type: 'rule', rule_type: 'sqft',
        label: `${sqft.toLocaleString()} sqft × $${rate.toFixed(2)}/sqft`,
        amount: round2(sqft * rate),
      };
    }

    case 'tiered': {
      // config.tiers = [{ threshold, rate }, ...] — pick the highest tier ≤ tier_input
      const tiers = Array.isArray(config.tiers) ? config.tiers : [];
      const input = Number(ctx.tier_input || 0);
      const tier = tiers
        .filter((t) => Number(t.threshold) <= input)
        .sort((a, b) => Number(b.threshold) - Number(a.threshold))[0];
      const tierRate = Number(tier?.rate ?? rate);
      return {
        type: 'rule', rule_type: 'tiered',
        label: `Tier ${tier?.threshold ?? 0}+ @ $${tierRate.toFixed(2)}`,
        amount: round2(tierRate),
      };
    }

    default:
      // Unknown rule types are silently ignored — never throw, never block a quote.
      return null;
  }
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
function round2(n) { return Math.round(n * 100) / 100; }

module.exports = { computeQuote, RULE_TYPES };

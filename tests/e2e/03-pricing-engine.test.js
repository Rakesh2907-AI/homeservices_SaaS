const { computeQuote } = require('../../shared/pricing/engine');

/**
 * Unit tests for the pricing engine. These run without a DB and exercise
 * every rule type.
 */
describe('Pricing engine', () => {
  const service = { id: 's1', category_id: 'c1', title: 'Drain unclog', base_price: 149, duration_mins: 60 };

  test('falls back to base_price when no rules', () => {
    const q = computeQuote(service, [], []);
    expect(q.line_items).toHaveLength(1);
    expect(q.line_items[0].amount).toBe(149);
    expect(q.subtotal).toBe(149);
    expect(q.total).toBe(149);
  });

  test('flat rule replaces base_price', () => {
    const rules = [{ rule_type: 'flat', rate: 200 }];
    const q = computeQuote(service, rules, []);
    expect(q.subtotal).toBe(200);
  });

  test('hourly rule uses ctx.hours when provided', () => {
    const rules = [{ rule_type: 'hourly', rate: 95, config: { min_hours: 1 } }];
    const q = computeQuote(service, rules, [], { hours: 2.5 });
    expect(q.subtotal).toBe(237.5);
  });

  test('hourly rule respects min_hours clamp', () => {
    const rules = [{ rule_type: 'hourly', rate: 100, config: { min_hours: 2 } }];
    const q = computeQuote(service, rules, [], { hours: 0.5 });
    expect(q.subtotal).toBe(200);
  });

  test('distance rule only charges miles outside the radius', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }, { rule_type: 'distance', rate: 2.5, config: { included_radius_miles: 10 } }];
    const q = computeQuote(service, rules, [], { distance_miles: 25 });
    // 100 + (25 - 10) * 2.5 = 100 + 37.5 = 137.50
    expect(q.subtotal).toBe(137.5);
  });

  test('sqft rule scales by square footage', () => {
    const rules = [{ rule_type: 'sqft', rate: 0.35 }];
    const q = computeQuote(service, rules, [], { sqft: 1800 });
    expect(q.subtotal).toBe(630);
  });

  test('after_hours adds a 50% surcharge to the running base', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }];
    const q = computeQuote(service, rules, [], { after_hours: true });
    // 100 base + 50 (50%) = 150
    expect(q.subtotal).toBe(150);
  });

  test('discount appears as negative line item', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }];
    const q = computeQuote(service, rules, [], { discount_amount: 25, discount_label: 'Promo' });
    expect(q.subtotal).toBe(75);
    expect(q.line_items.some((it) => it.amount === -25 && it.label === 'Promo')).toBe(true);
  });

  test('taxes are applied on subtotal', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }];
    const q = computeQuote(service, rules, [], {}, { tax_rate: 0.0875 });
    expect(q.taxes).toBe(8.75);
    expect(q.total).toBe(108.75);
  });

  test('platform commission appears in the breakdown', () => {
    const rules = [{ rule_type: 'flat', rate: 200 }];
    const commissions = [{ name: 'Platform fee', applies_to: 'platform', rate_type: 'percent', rate_value: 5, is_active: true }];
    const q = computeQuote(service, rules, commissions);
    expect(q.commissions).toHaveLength(1);
    expect(q.commissions[0].amount).toBe(10); // 5% of 200
  });

  test('service-scoped commission only applies to matching service', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }];
    const commissions = [
      { name: 'Tech split A', applies_to: 'service', target_id: 's1', rate_type: 'percent', rate_value: 20, is_active: true },
      { name: 'Tech split B', applies_to: 'service', target_id: 'other', rate_type: 'percent', rate_value: 99, is_active: true },
    ];
    const q = computeQuote(service, rules, commissions);
    expect(q.commissions.map((c) => c.name)).toEqual(['Tech split A']);
    expect(q.commissions[0].amount).toBe(20);
  });

  test('inactive commissions are ignored', () => {
    const rules = [{ rule_type: 'flat', rate: 100 }];
    const commissions = [{ name: 'Old', applies_to: 'platform', rate_type: 'percent', rate_value: 50, is_active: false }];
    const q = computeQuote(service, rules, commissions);
    expect(q.commissions).toHaveLength(0);
  });
});

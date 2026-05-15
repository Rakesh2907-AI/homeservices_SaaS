/**
 * Backfills subscriptions for existing tenants and seeds sample tax rates,
 * discount codes, invoices, and admin notifications so the new pages have
 * meaningful data on first load. Idempotent.
 */
exports.seed = async (knex) => {
  await knex.raw("SELECT set_config('app.is_super_admin', 'on', false)");

  // Auto-create subscription rows for every active tenant that doesn't have one.
  const plans = await knex('subscription_plans').select('*');
  const planByName = Object.fromEntries(plans.map((p) => [p.name, p]));
  const tenants = await knex('tenants').whereNot('subdomain', '__platform__').andWhere('is_active', true);

  for (const t of tenants) {
    const existing = await knex('subscriptions').where({ tenant_id: t.tenant_id }).first();
    if (existing) continue;
    const plan = planByName[t.plan_tier] || planByName.basic;
    const mrrCents = Math.round(Number(plan.price_monthly) * 100);
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await knex('subscriptions').insert({
      tenant_id: t.tenant_id,
      plan_id: plan.id,
      status: 'active',
      billing_cycle: 'monthly',
      mrr_cents: mrrCents,
      current_period_start: now,
      current_period_end: periodEnd,
    });
  }

  // ----- Sample tax rates (idempotent by name) -----
  const rates = [
    { name: 'California Sales Tax',       rate: 0.0725, country: 'US', region: 'CA', category: 'service' },
    { name: 'New York Sales Tax',         rate: 0.08,   country: 'US', region: 'NY', category: 'service' },
    { name: 'Texas State Tax',            rate: 0.0625, country: 'US', region: 'TX', category: 'service' },
    { name: 'Florida State Tax',          rate: 0.06,   country: 'US', region: 'FL', category: 'service' },
    { name: 'Oregon (no sales tax)',      rate: 0.00,   country: 'US', region: 'OR', category: 'service' },
    { name: 'Washington State Tax',       rate: 0.065,  country: 'US', region: 'WA', category: 'service' },
    { name: 'Ontario HST',                rate: 0.13,   country: 'CA', region: 'ON', category: 'service' },
    { name: 'UK VAT (standard)',          rate: 0.20,   country: 'GB',               category: 'service' },
  ];
  for (const r of rates) {
    const exists = await knex('tax_rates').where({ name: r.name }).first();
    if (!exists) await knex('tax_rates').insert(r);
  }

  // ----- Sample discount codes -----
  const codes = [
    { code: 'WELCOME20',  name: 'New tenant welcome',     discount_type: 'percent', discount_value: 20, scope: 'all',          max_uses: null },
    { code: 'BLACKFRI50', name: 'Black Friday 2025',       discount_type: 'percent', discount_value: 50, scope: 'all',          max_uses: 1000, valid_until: '2026-12-01' },
    { code: 'PROUPGRADE', name: 'Pro upgrade special',     discount_type: 'flat',    discount_value: 40, scope: 'plan:pro',     max_uses: null },
    { code: 'ENTERPRISE', name: 'Enterprise contact',      discount_type: 'percent', discount_value: 15, scope: 'plan:enterprise', max_uses: null },
  ];
  for (const c of codes) {
    const exists = await knex('discount_codes').where({ code: c.code }).first();
    if (!exists) await knex('discount_codes').insert({ ...c, scope_target: '[]' });
  }

  // ----- Sample invoices for each tenant -----
  const subs = await knex('subscriptions').select('*');
  let invoiceCounter = 1000;
  for (const sub of subs) {
    const tenantInvoices = await knex('invoices').where({ tenant_id: sub.tenant_id }).count('id as n');
    if (parseInt(tenantInvoices[0].n, 10) > 0) continue;

    // Generate 3 historical invoices per tenant.
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo -= 1) {
      const issuedAt = new Date();
      issuedAt.setMonth(issuedAt.getMonth() - monthsAgo);
      issuedAt.setDate(1);
      const dueAt = new Date(issuedAt);
      dueAt.setDate(dueAt.getDate() + 14);
      const paidAt = monthsAgo > 0 ? new Date(dueAt) : null;
      const status = monthsAgo > 0 ? 'paid' : 'sent';

      const subtotal = sub.mrr_cents;
      const tax = Math.round(subtotal * 0.0875);
      const total = subtotal + tax;
      invoiceCounter += 1;

      await knex('invoices').insert({
        tenant_id: sub.tenant_id,
        subscription_id: sub.id,
        invoice_number: `INV-${invoiceCounter}`,
        status,
        subtotal_cents: subtotal,
        tax_cents: tax,
        total_cents: total,
        items: JSON.stringify([{ label: 'Subscription', amount_cents: subtotal }]),
        issued_at: issuedAt,
        due_at: dueAt,
        paid_at: paidAt,
      });
    }
  }

  // ----- Sample admin notifications -----
  const existingNotifs = await knex('admin_notifications').count('id as n');
  if (parseInt(existingNotifs[0].n, 10) === 0) {
    const platform = await knex('tenants').whereNot('subdomain', '__platform__').limit(2);
    const samples = [
      { type: 'tenant_signed_up', severity: 'success', title: 'New tenant: TidyHome Cleaning',     body: 'Pro plan · 1 user · 0 bookings',     tenant_id: platform[0]?.tenant_id },
      { type: 'invoice_paid',     severity: 'success', title: 'Invoice INV-1003 paid',              body: '$99.00 from Acme Plumbing',           tenant_id: platform[0]?.tenant_id },
      { type: 'invoice_overdue',  severity: 'warning', title: 'Invoice INV-1006 is 3 days overdue', body: '$29.00 from Globex HVAC',             tenant_id: platform[1]?.tenant_id },
      { type: 'system_alert',     severity: 'info',    title: 'Daily backup completed',             body: '9.8 MB · 12 tables · 1.2 s' },
      { type: 'tenant_suspended', severity: 'critical', title: 'Tenant suspended for non-payment',   body: 'Invoice INV-1006 unpaid >7 days',     tenant_id: platform[1]?.tenant_id },
    ];
    for (const n of samples) {
      await knex('admin_notifications').insert(n);
    }
  }

  console.log('✓ Revenue & billing seed complete');
};

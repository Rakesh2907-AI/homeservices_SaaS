/**
 * Revenue & billing tables. All global (not tenant-scoped), readable only
 * by super admins via the admin API.
 *
 * Design choices:
 *  - Money is stored as cents (integer) — never floats. Total amounts in
 *    `*_cents` columns. Convert to decimal only in the display layer.
 *  - `subscriptions` is the source of truth for what a tenant pays right now.
 *    `tenants.plan_tier` is kept as a denormalized read-side convenience.
 *  - `invoices.items` is JSON so we don't need a separate invoice_lines table
 *    for the v1 of billing — each subscription period produces one invoice.
 */
exports.up = async (knex) => {
  // ---------- subscriptions ----------
  await knex.schema.createTable('subscriptions', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.uuid('plan_id').notNullable().references('id').inTable('subscription_plans');
    t.string('status', 20).notNullable().defaultTo('active'); // trialing | active | past_due | canceled
    t.string('billing_cycle', 20).notNullable().defaultTo('monthly'); // monthly | annual
    t.integer('mrr_cents').notNullable().defaultTo(0);
    t.timestamp('trial_end');
    t.timestamp('current_period_start').notNullable().defaultTo(knex.fn.now());
    t.timestamp('current_period_end').notNullable();
    t.timestamp('canceled_at');
    t.string('cancel_reason', 255);
    t.string('stripe_subscription_id', 255);
    t.timestamps(true, true);
    t.unique('tenant_id');
  });
  await knex.raw('CREATE INDEX idx_subscriptions_status ON subscriptions(status, current_period_end)');

  // ---------- invoices ----------
  await knex.schema.createTable('invoices', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.uuid('subscription_id').references('id').inTable('subscriptions').onDelete('SET NULL');
    t.string('invoice_number', 50).notNullable().unique();
    t.string('status', 20).notNullable().defaultTo('draft'); // draft | sent | paid | overdue | void | refunded
    t.integer('subtotal_cents').notNullable().defaultTo(0);
    t.integer('tax_cents').notNullable().defaultTo(0);
    t.integer('discount_cents').notNullable().defaultTo(0);
    t.integer('total_cents').notNullable().defaultTo(0);
    t.string('currency', 3).notNullable().defaultTo('USD');
    t.jsonb('items').notNullable().defaultTo('[]');
    t.timestamp('issued_at').notNullable().defaultTo(knex.fn.now());
    t.timestamp('due_at');
    t.timestamp('paid_at');
    t.string('stripe_invoice_id', 255);
    t.text('notes');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_invoices_tenant_status ON invoices(tenant_id, status, issued_at DESC)');

  // ---------- tax_rates ----------
  await knex.schema.createTable('tax_rates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 255).notNullable();              // "California Sales Tax"
    t.decimal('rate', 6, 4).notNullable();            // 0.0875 = 8.75%
    t.string('country', 2).notNullable().defaultTo('US');
    t.string('region', 50);                            // state / province
    t.string('postal_code_prefix', 10);                // optional finer scope
    t.string('category', 50).defaultTo('service');     // service | digital | physical
    t.boolean('inclusive').notNullable().defaultTo(false);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_tax_rates_geo ON tax_rates(country, region, is_active)');

  // ---------- discount_codes ----------
  await knex.schema.createTable('discount_codes', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('code', 50).notNullable().unique();      // e.g. "WELCOME20"
    t.string('name', 255).notNullable();
    t.string('discount_type', 20).notNullable();      // percent | flat
    t.decimal('discount_value', 10, 2).notNullable();
    t.string('scope', 50).notNullable().defaultTo('all'); // all | plan:basic | plan:pro | plan:enterprise | tenants
    t.jsonb('scope_target').defaultTo('[]');           // tenant_ids when scope = 'tenants'
    t.integer('max_uses');                             // null = unlimited
    t.integer('used_count').notNullable().defaultTo(0);
    t.timestamp('valid_from').defaultTo(knex.fn.now());
    t.timestamp('valid_until');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, valid_until)');

  // ---------- admin_notifications (operator inbox) ----------
  await knex.schema.createTable('admin_notifications', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('type', 50).notNullable();               // tenant_signed_up | tenant_suspended | invoice_paid | invoice_overdue | system_alert
    t.string('severity', 20).notNullable().defaultTo('info'); // info | warning | critical | success
    t.string('title', 500).notNullable();
    t.text('body');
    t.uuid('tenant_id').references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('related_entity_type', 50);
    t.uuid('related_entity_id');
    t.boolean('is_read').notNullable().defaultTo(false);
    t.timestamp('read_at');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_notif_unread ON admin_notifications(is_read, created_at DESC)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('admin_notifications');
  await knex.schema.dropTableIfExists('discount_codes');
  await knex.schema.dropTableIfExists('tax_rates');
  await knex.schema.dropTableIfExists('invoices');
  await knex.schema.dropTableIfExists('subscriptions');
};

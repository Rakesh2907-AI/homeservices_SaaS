/**
 * Adds:
 *  - tenants.onboarding_status (jsonb) — tracks wizard progress per step
 *  - tenants.business_details (jsonb) — phone, address, tax id, hours, etc.
 *  - commission_structures table — platform/staff commission rules per tenant
 *  - service_areas table — geographic coverage zones
 */
exports.up = async (knex) => {
  await knex.schema.alterTable('tenants', (t) => {
    t.jsonb('onboarding_status').notNullable().defaultTo(
      knex.raw(`'{"completed":false,"current_step":"theme","steps_done":[]}'::jsonb`)
    );
    t.jsonb('business_details').notNullable().defaultTo('{}');
  });

  await knex.schema.createTable('commission_structures', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('name', 100).notNullable();                     // e.g. "Default plumber commission"
    t.string('applies_to', 50).notNullable();                // 'platform' | 'staff' | 'category' | 'service'
    t.uuid('target_id');                                     // category_id or service_id when scoped
    t.string('rate_type', 20).notNullable();                 // 'percent' | 'flat'
    t.decimal('rate_value', 10, 2).notNullable();            // 15.00 = 15% OR $15 flat
    t.decimal('min_amount', 10, 2);                          // floor
    t.decimal('max_amount', 10, 2);                          // cap
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata').notNullable().defaultTo('{}');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_commissions_tenant_active ON commission_structures(tenant_id, is_active)');

  await knex.raw('ALTER TABLE commission_structures ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE commission_structures FORCE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY tenant_isolation_commission_structures ON commission_structures
    USING (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
    WITH CHECK (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
  `);

  await knex.schema.createTable('service_areas', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('name', 255).notNullable();                     // "Portland Metro"
    t.string('postal_code', 20);
    t.string('city', 100);
    t.string('state', 50);
    t.string('country', 50).defaultTo('US');
    t.decimal('extra_fee', 10, 2).defaultTo(0);              // travel surcharge
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_areas_tenant ON service_areas(tenant_id, postal_code)');
  await knex.raw('ALTER TABLE service_areas ENABLE ROW LEVEL SECURITY');
  await knex.raw('ALTER TABLE service_areas FORCE ROW LEVEL SECURITY');
  await knex.raw(`
    CREATE POLICY tenant_isolation_service_areas ON service_areas
    USING (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
    WITH CHECK (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
  `);
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('service_areas');
  await knex.schema.dropTableIfExists('commission_structures');
  await knex.schema.alterTable('tenants', (t) => {
    t.dropColumn('onboarding_status');
    t.dropColumn('business_details');
  });
};

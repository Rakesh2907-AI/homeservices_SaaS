/**
 * Core multi-tenant schema. Every tenant-scoped table carries tenant_id
 * and is protected by RLS policies defined in the next migration.
 */
exports.up = async (knex) => {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // ===== Global =====
  await knex.schema.createTable('subscription_plans', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 100).notNullable().unique();
    t.jsonb('features').notNullable().defaultTo('{}');
    t.jsonb('resource_limits').notNullable().defaultTo('{}');
    t.decimal('price_monthly', 10, 2);
    t.string('stripe_price_id', 255);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('tenants', (t) => {
    t.uuid('tenant_id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('business_name', 255).notNullable();
    t.string('subdomain', 100).notNullable().unique();
    t.string('custom_domain', 255).unique();
    t.string('plan_tier', 50).notNullable().defaultTo('basic');
    t.text('logo_url');
    t.jsonb('theme_config').notNullable().defaultTo('{}');
    t.jsonb('settings').notNullable().defaultTo('{}');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_tenants_subdomain ON tenants(subdomain)');
  await knex.raw('CREATE INDEX idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL');

  // ===== Tenant-scoped =====
  await knex.schema.createTable('users', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('email', 255).notNullable();
    t.string('password_hash', 255);
    t.string('full_name', 255);
    t.string('role', 50).notNullable().defaultTo('staff'); // super_admin | business_admin | staff | viewer
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_login_at');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'email']);
  });
  await knex.raw('CREATE INDEX idx_users_tenant ON users(tenant_id)');

  await knex.schema.createTable('service_categories', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('name', 255).notNullable();
    t.text('description');
    t.uuid('parent_category_id').references('id').inTable('service_categories').onDelete('SET NULL');
    t.text('icon_url');
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_categories_tenant_parent ON service_categories(tenant_id, parent_category_id)');

  await knex.schema.createTable('services', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.uuid('category_id').notNullable().references('id').inTable('service_categories').onDelete('RESTRICT');
    t.string('title', 255).notNullable();
    t.text('description');
    t.decimal('base_price', 10, 2);
    t.integer('duration_mins');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.jsonb('metadata').notNullable().defaultTo('{}');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_services_tenant_cat ON services(tenant_id, category_id)');

  await knex.schema.createTable('pricing_structures', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.uuid('service_id').notNullable().references('id').inTable('services').onDelete('CASCADE');
    t.string('rule_type', 50).notNullable(); // hourly | flat | distance | sqft | tiered
    t.decimal('rate', 10, 2);
    t.jsonb('config').notNullable().defaultTo('{}');
    t.timestamp('effective_from').defaultTo(knex.fn.now());
    t.timestamp('effective_to');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_pricing_tenant_service ON pricing_structures(tenant_id, service_id)');

  await knex.schema.createTable('customers', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').notNullable().references('tenant_id').inTable('tenants').onDelete('CASCADE');
    t.string('full_name', 255).notNullable();
    t.string('email', 255);
    t.string('phone', 50);
    t.jsonb('address').defaultTo('{}');
    t.jsonb('metadata').defaultTo('{}');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_customers_tenant ON customers(tenant_id)');
  await knex.raw('CREATE INDEX idx_customers_tenant_email ON customers(tenant_id, email) WHERE email IS NOT NULL');

  // Partitioned bookings table — partitions added separately
  await knex.raw(`
    CREATE TABLE bookings (
      id              UUID NOT NULL DEFAULT gen_random_uuid(),
      tenant_id       UUID NOT NULL,
      customer_id     UUID NOT NULL,
      service_id      UUID NOT NULL,
      assigned_staff  UUID,
      scheduled_at    TIMESTAMPTZ NOT NULL,
      status          VARCHAR(50) NOT NULL DEFAULT 'pending',
      quoted_price    DECIMAL(10,2),
      notes           TEXT,
      metadata        JSONB NOT NULL DEFAULT '{}',
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id, tenant_id)
    ) PARTITION BY HASH (tenant_id)
  `);
  // 8 hash partitions — increase at scale.
  for (let i = 0; i < 8; i += 1) {
    await knex.raw(
      `CREATE TABLE bookings_p${i} PARTITION OF bookings FOR VALUES WITH (MODULUS 8, REMAINDER ${i})`
    );
  }
  await knex.raw('CREATE INDEX idx_bookings_tenant_sched ON bookings(tenant_id, scheduled_at DESC)');
  await knex.raw('CREATE INDEX idx_bookings_tenant_status ON bookings(tenant_id, status)');
  await knex.raw('CREATE INDEX idx_bookings_tenant_customer ON bookings(tenant_id, customer_id)');

  // Partitioned audit_logs
  await knex.raw(`
    CREATE TABLE audit_logs (
      id           UUID NOT NULL DEFAULT gen_random_uuid(),
      tenant_id    UUID NOT NULL,
      actor_id     UUID,
      entity_type  VARCHAR(100) NOT NULL,
      entity_id    UUID NOT NULL,
      action       VARCHAR(50) NOT NULL,
      old_value    JSONB,
      new_value    JSONB,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (id, tenant_id)
    ) PARTITION BY HASH (tenant_id)
  `);
  for (let i = 0; i < 8; i += 1) {
    await knex.raw(
      `CREATE TABLE audit_logs_p${i} PARTITION OF audit_logs FOR VALUES WITH (MODULUS 8, REMAINDER ${i})`
    );
  }
  await knex.raw('CREATE INDEX idx_audit_tenant_entity ON audit_logs(tenant_id, entity_type, created_at DESC)');

  await knex.schema.createTable('feature_flags', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('tenant_id').references('tenant_id').inTable('tenants').onDelete('CASCADE'); // null = global
    t.string('flag_key', 255).notNullable();
    t.boolean('is_enabled').notNullable().defaultTo(false);
    t.jsonb('config').notNullable().defaultTo('{}');
    t.timestamps(true, true);
    t.unique(['tenant_id', 'flag_key']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('feature_flags');
  await knex.raw('DROP TABLE IF EXISTS audit_logs CASCADE');
  await knex.raw('DROP TABLE IF EXISTS bookings CASCADE');
  await knex.schema.dropTableIfExists('customers');
  await knex.schema.dropTableIfExists('pricing_structures');
  await knex.schema.dropTableIfExists('services');
  await knex.schema.dropTableIfExists('service_categories');
  await knex.schema.dropTableIfExists('users');
  await knex.schema.dropTableIfExists('tenants');
  await knex.schema.dropTableIfExists('subscription_plans');
};

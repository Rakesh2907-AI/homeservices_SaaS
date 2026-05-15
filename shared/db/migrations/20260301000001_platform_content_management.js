/**
 * Platform & content management tables.
 *
 * All rows here are GLOBAL (platform-owned), not tenant-scoped. They are
 * read by tenants but only written by super_admin. RLS is therefore not
 * enabled on these tables — visibility is controlled at the API layer.
 */
exports.up = async (knex) => {
  // ---------- Platform: announcements (banners shown in tenant dashboards) ----------
  await knex.schema.createTable('announcements', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('title', 255).notNullable();
    t.text('body').notNullable();
    t.string('level', 20).notNullable().defaultTo('info'); // info | success | warning | critical
    t.string('audience', 50).notNullable().defaultTo('all'); // all | plan:basic | plan:pro | plan:enterprise | tenants
    t.jsonb('audience_tenant_ids').defaultTo('[]'); // when audience='tenants'
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('starts_at').defaultTo(knex.fn.now());
    t.timestamp('expires_at');
    t.uuid('created_by'); // super admin user id
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_announcements_active ON announcements(is_active, starts_at, expires_at)');

  // ---------- Platform: email templates ----------
  await knex.schema.createTable('email_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('template_key', 100).notNullable().unique(); // welcome, booking_confirm, password_reset, etc.
    t.string('name', 255).notNullable();
    t.string('subject', 500).notNullable();
    t.text('body_html').notNullable();
    t.text('body_text');
    t.jsonb('variables').defaultTo('[]'); // list of expected mustache vars
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  // ---------- Platform: theme presets (moved from in-memory array) ----------
  await knex.schema.createTable('theme_presets', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('slug', 50).notNullable().unique();
    t.string('name', 100).notNullable();
    t.text('description');
    t.jsonb('config').notNullable().defaultTo('{}');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('sort_order').defaultTo(0);
    t.timestamps(true, true);
  });

  // ---------- Platform: API keys for the public REST API ----------
  await knex.schema.createTable('api_keys', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 255).notNullable();
    t.string('key_prefix', 16).notNullable();        // first chars (shown), e.g. "sk_live_a1b2"
    t.string('key_hash', 255).notNullable().unique(); // bcrypt of full key
    t.jsonb('scopes').notNullable().defaultTo('[]'); // ["bookings:read","tenants:write",...]
    t.timestamp('last_used_at');
    t.timestamp('expires_at');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.uuid('created_by');
    t.timestamps(true, true);
  });

  // ---------- Platform: webhooks (outgoing events) ----------
  await knex.schema.createTable('webhooks', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('name', 255).notNullable();
    t.string('url', 2048).notNullable();
    t.jsonb('events').notNullable().defaultTo('[]'); // ["tenant.created","booking.completed",...]
    t.string('secret', 255);                          // signing secret
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamp('last_delivery_at');
    t.string('last_delivery_status', 50);             // success | failed | pending
    t.integer('failure_count').defaultTo(0);
    t.timestamps(true, true);
  });

  // ---------- Content: blog posts ----------
  await knex.schema.createTable('blog_posts', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('slug', 255).notNullable().unique();
    t.string('title', 500).notNullable();
    t.text('excerpt');
    t.text('body').notNullable();
    t.string('author', 255);
    t.string('author_role', 255);
    t.string('category', 100);
    t.jsonb('tags').defaultTo('[]');
    t.string('read_time', 50);
    t.boolean('is_published').notNullable().defaultTo(false);
    t.timestamp('published_at');
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_blog_published ON blog_posts(is_published, published_at DESC)');

  // ---------- Content: changelog entries ----------
  await knex.schema.createTable('changelog_entries', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('version', 50).notNullable();
    t.string('title', 500).notNullable();
    t.string('tag', 50).notNullable().defaultTo('Feature'); // Feature | Improvement | Fix | Security | Breaking
    t.jsonb('notes').notNullable().defaultTo('[]');
    t.timestamp('released_at').notNullable().defaultTo(knex.fn.now());
    t.boolean('is_published').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_changelog_released ON changelog_entries(released_at DESC)');

  // ---------- Content: reusable category templates (tenants can apply) ----------
  await knex.schema.createTable('category_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.string('industry', 100).notNullable();          // 'plumbing','hvac','cleaning',...
    t.string('name', 255).notNullable();
    t.text('description');
    t.uuid('parent_id').references('id').inTable('category_templates').onDelete('SET NULL');
    t.integer('sort_order').defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_cat_templates_industry ON category_templates(industry, sort_order)');

  // ---------- Content: reusable service templates ----------
  await knex.schema.createTable('service_templates', (t) => {
    t.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    t.uuid('category_template_id').references('id').inTable('category_templates').onDelete('CASCADE');
    t.string('title', 255).notNullable();
    t.text('description');
    t.decimal('default_price', 10, 2);
    t.integer('default_duration_mins');
    t.jsonb('default_pricing_rule').defaultTo('{}');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });
  await knex.raw('CREATE INDEX idx_svc_templates_cat ON service_templates(category_template_id)');
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('service_templates');
  await knex.schema.dropTableIfExists('category_templates');
  await knex.schema.dropTableIfExists('changelog_entries');
  await knex.schema.dropTableIfExists('blog_posts');
  await knex.schema.dropTableIfExists('webhooks');
  await knex.schema.dropTableIfExists('api_keys');
  await knex.schema.dropTableIfExists('theme_presets');
  await knex.schema.dropTableIfExists('email_templates');
  await knex.schema.dropTableIfExists('announcements');
};

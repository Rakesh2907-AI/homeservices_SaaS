/**
 * Seeds subscription plans and one demo tenant ("Acme Plumbing") with
 * sample categories, services, and a business admin user.
 */
const bcrypt = require('bcryptjs');

exports.seed = async (knex) => {
  await knex('subscription_plans').del();

  await knex('subscription_plans').insert([
    {
      name: 'basic',
      features: JSON.stringify({ analytics: false, custom_domain: false }),
      resource_limits: JSON.stringify({ cpu: '500m', memory: '512Mi', users: 5 }),
      price_monthly: 29,
    },
    {
      name: 'pro',
      features: JSON.stringify({ analytics: true, custom_domain: true }),
      resource_limits: JSON.stringify({ cpu: '1', memory: '1Gi', users: 25 }),
      price_monthly: 99,
    },
    {
      name: 'enterprise',
      features: JSON.stringify({ analytics: true, custom_domain: true, dedicated_db: true }),
      resource_limits: JSON.stringify({ cpu: '4', memory: '4Gi', users: 500 }),
      price_monthly: 499,
    },
  ]);

  // Demo tenant — seeded with super_admin context so RLS allows the insert.
  await knex.raw("SET LOCAL app.is_super_admin = 'on'");

  const [tenant] = await knex('tenants')
    .insert({
      business_name: 'Acme Plumbing',
      subdomain: 'acme',
      plan_tier: 'pro',
      logo_url: 'https://placehold.co/200x80?text=Acme',
      theme_config: JSON.stringify({
        primary_color: '#0044cc',
        secondary_color: '#ff6600',
        font_family: 'Inter, sans-serif',
      }),
    })
    .returning('*');

  await knex.raw(`SET LOCAL app.current_tenant = '${tenant.tenant_id}'`);

  await knex('users').insert({
    tenant_id: tenant.tenant_id,
    email: 'admin@acme.test',
    password_hash: bcrypt.hashSync('password123', 10),
    full_name: 'Acme Admin',
    role: 'business_admin',
  });

  const [residential] = await knex('service_categories')
    .insert({ tenant_id: tenant.tenant_id, name: 'Residential', sort_order: 1 })
    .returning('*');

  const [commercial] = await knex('service_categories')
    .insert({ tenant_id: tenant.tenant_id, name: 'Commercial', sort_order: 2 })
    .returning('*');

  const [drainCat] = await knex('service_categories')
    .insert({
      tenant_id: tenant.tenant_id,
      name: 'Drain Cleaning',
      parent_category_id: residential.id,
      sort_order: 1,
    })
    .returning('*');

  const [service] = await knex('services')
    .insert({
      tenant_id: tenant.tenant_id,
      category_id: drainCat.id,
      title: 'Standard Drain Unclog',
      description: 'Up to 50 ft of clearing for residential drains.',
      base_price: 149.0,
      duration_mins: 60,
    })
    .returning('*');

  await knex('pricing_structures').insert([
    {
      tenant_id: tenant.tenant_id,
      service_id: service.id,
      rule_type: 'flat',
      rate: 149.0,
      config: JSON.stringify({ description: 'Standard flat fee' }),
    },
    {
      tenant_id: tenant.tenant_id,
      service_id: service.id,
      rule_type: 'hourly',
      rate: 95.0,
      config: JSON.stringify({ min_hours: 1, max_hours: 4 }),
    },
  ]);

  // Suppress unused-variable lint
  void commercial;

  console.log(`✓ Seeded demo tenant: ${tenant.business_name} (${tenant.subdomain})`);
};

/**
 * Seeds a single platform-wide super admin user.
 *
 * Super admins are stored in the `users` table but with a NULL-equivalent
 * sentinel tenant pointing at the platform tenant. To keep schema simple,
 * we use a dedicated "platform" tenant row (subdomain reserved, never
 * exposed via public routes).
 *
 * Credentials are intentionally weak in dev — rotate in production.
 */
const bcrypt = require('bcryptjs');

const PLATFORM_SLUG = '__platform__';

exports.seed = async (knex) => {
  // SELECT set_config with is_local=false applies for the duration of this session
  // (knex reuses one connection per seed file run).
  await knex.raw("SELECT set_config('app.is_super_admin', 'on', false)");

  // Idempotent: only create if missing.
  let { rows } = await knex.raw(
    'SELECT tenant_id FROM tenants WHERE subdomain = ? LIMIT 1',
    [PLATFORM_SLUG]
  );
  let platformTenantId = rows[0]?.tenant_id;

  if (!platformTenantId) {
    const inserted = await knex('tenants')
      .insert({
        business_name: 'ServiceHub Platform',
        subdomain: PLATFORM_SLUG,
        plan_tier: 'enterprise',
        is_active: false, // never reachable via subdomain routing
        theme_config: JSON.stringify({}),
        onboarding_status: JSON.stringify({ completed: true, current_step: 'complete', steps_done: [] }),
      })
      .returning('tenant_id');
    platformTenantId = inserted[0].tenant_id;
  }

  // Upsert super admin user
  const existing = await knex.raw(
    "SELECT id FROM users WHERE tenant_id = ? AND email = ? LIMIT 1",
    [platformTenantId, 'super@servicehub.app']
  );

  if (!existing.rows[0]) {
    await knex('users').insert({
      tenant_id: platformTenantId,
      email: 'super@servicehub.app',
      password_hash: bcrypt.hashSync('superadmin123', 10),
      full_name: 'Platform Super Admin',
      role: 'super_admin',
    });
    console.log('✓ Seeded super admin: super@servicehub.app / superadmin123');
  } else {
    console.log('• Super admin already exists, skipping');
  }
};

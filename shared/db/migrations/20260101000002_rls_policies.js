/**
 * Row-Level Security policies. Each request must set `app.current_tenant`
 * via `SET LOCAL app.current_tenant = '<uuid>'` before issuing queries.
 *
 * Super admins bypass RLS by setting `app.is_super_admin = 'on'`.
 *
 * FORCE RLS means even table owners obey policies (defense-in-depth).
 */
const TENANT_TABLES = [
  'users',
  'service_categories',
  'services',
  'pricing_structures',
  'customers',
  'bookings',
  'audit_logs',
  'feature_flags',
];

exports.up = async (knex) => {
  // Ensure the app_user role exists (idempotent — already created by init-db.sql)
  await knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_user') THEN
        CREATE ROLE app_user LOGIN PASSWORD 'app_password';
      END IF;
    END$$;
  `);
  await knex.raw('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user');
  await knex.raw('GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user');

  for (const table of TENANT_TABLES) {
    await knex.raw(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    await knex.raw(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY`);

    // SELECT/UPDATE/DELETE policy — tenants only see their rows
    await knex.raw(`
      CREATE POLICY tenant_isolation_${table} ON ${table}
      USING (
        current_setting('app.is_super_admin', true) = 'on'
        OR tenant_id::text = current_setting('app.current_tenant', true)
      )
      WITH CHECK (
        current_setting('app.is_super_admin', true) = 'on'
        OR tenant_id::text = current_setting('app.current_tenant', true)
      )
    `);
  }

  // feature_flags has nullable tenant_id (global flags). Override its policy.
  await knex.raw('DROP POLICY tenant_isolation_feature_flags ON feature_flags');
  await knex.raw(`
    CREATE POLICY tenant_isolation_feature_flags ON feature_flags
    USING (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id IS NULL
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
    WITH CHECK (
      current_setting('app.is_super_admin', true) = 'on'
      OR tenant_id::text = current_setting('app.current_tenant', true)
    )
  `);
};

exports.down = async (knex) => {
  for (const table of TENANT_TABLES) {
    await knex.raw(`DROP POLICY IF EXISTS tenant_isolation_${table} ON ${table}`);
    await knex.raw(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY`);
  }
};

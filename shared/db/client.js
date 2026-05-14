/**
 * PostgreSQL client wrapper around `pg.Pool` with helpers that scope every
 * query to a tenant via `SET LOCAL app.current_tenant`. RLS policies enforce
 * the actual row filtering.
 *
 * Always use `withTenant(tenantId, async (client) => { ... })` for tenant
 * work — the wrapper opens a transaction, sets the context, and releases
 * the connection on exit (preventing context leaks across pooled clients).
 */
const { Pool } = require('pg');
const logger = require('../utils/logger');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://saas_user:saas_password@localhost:5432/homeservices';

const pool = new Pool({
  connectionString,
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => logger.error({ err }, 'pg pool error'));

const readPool = process.env.DATABASE_READ_URL
  ? new Pool({ connectionString: process.env.DATABASE_READ_URL, max: 10 })
  : pool;

/**
 * Run a callback inside a transaction with the tenant RLS context set.
 * @param {string} tenantId UUID
 * @param {(client: import('pg').PoolClient) => Promise<T>} fn
 * @template T
 */
async function withTenant(tenantId, fn, { readOnly = false } = {}) {
  if (!tenantId) throw new Error('withTenant requires a tenantId');
  const client = await (readOnly ? readPool : pool).connect();
  try {
    await client.query('BEGIN');
    // set_config keeps the value local to the transaction.
    await client.query("SELECT set_config('app.current_tenant', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/** Run a callback as super admin (bypasses RLS). Use sparingly. */
async function withSuperAdmin(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.is_super_admin', 'on', true)");
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function close() {
  await pool.end();
  if (readPool !== pool) await readPool.end();
}

module.exports = { pool, readPool, withTenant, withSuperAdmin, close };

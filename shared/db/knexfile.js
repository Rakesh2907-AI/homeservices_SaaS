require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const baseConfig = {
  client: 'pg',
  connection: process.env.DATABASE_URL || 'postgresql://saas_user:saas_password@localhost:5432/homeservices',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2', 10),
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  },
  migrations: {
    directory: './migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
  },
};

module.exports = {
  development: baseConfig,
  test: { ...baseConfig, connection: process.env.DATABASE_TEST_URL || baseConfig.connection },
  production: baseConfig,
};

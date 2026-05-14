require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
process.env.SERVICE_NAME = 'tenant-service';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const { logger } = require('@hs/shared');

const tenantsRoutes = require('./routes/tenants');
const themesRoutes = require('./routes/themes');
const healthRoutes = require('./routes/health');

const app = Fastify({ logger });

async function start() {
  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });

  app.register(healthRoutes);
  app.register(tenantsRoutes, { prefix: '/api/v1/tenants' });
  app.register(themesRoutes, { prefix: '/api/v1/themes' });

  const port = parseInt(process.env.TENANT_SERVICE_PORT || '3001', 10);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`tenant-service listening on :${port}`);
}

start().catch((err) => {
  logger.fatal({ err }, 'failed to start tenant-service');
  process.exit(1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, async () => {
    logger.info({ sig }, 'shutting down');
    await app.close();
    process.exit(0);
  });
}

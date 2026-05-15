require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
process.env.SERVICE_NAME = 'auth-service';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const { logger } = require('@hs/shared');
const { registerMetrics } = require('@hs/shared/metrics');

const authRoutes = require('./routes/auth');

const app = Fastify({ loggerInstance: logger });

async function start() {
  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => ({ status: 'ok', service: 'auth-service' }));
  registerMetrics(app, 'auth-service');
  app.register(authRoutes, { prefix: '/api/v1/auth' });

  const port = parseInt(process.env.AUTH_SERVICE_PORT || '3002', 10);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`auth-service listening on :${port}`);
}

start().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});

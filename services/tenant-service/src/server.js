require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
process.env.SERVICE_NAME = 'tenant-service';

const path = require('path');
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const multipart = require('@fastify/multipart');
const fastifyStatic = require('@fastify/static');
const { logger } = require('@hs/shared');

const tenantsRoutes = require('./routes/tenants');
const themesRoutes = require('./routes/themes');
const healthRoutes = require('./routes/health');
const onboardingRoutes = require('./routes/onboarding');
const uploadsRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admin');

const app = Fastify({ loggerInstance: logger });

async function start() {
  // Helmet's CSP blocks <img src="..."> from cross-origin upload host in dev.
  await app.register(helmet, { contentSecurityPolicy: false, crossOriginResourcePolicy: false });
  await app.register(cors, { origin: true, credentials: true });
  await app.register(multipart, { limits: { fileSize: 2 * 1024 * 1024 } });
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, '../../../uploads'),
    prefix: '/uploads/',
    decorateReply: false,
  });

  app.register(healthRoutes);
  app.register(tenantsRoutes, { prefix: '/api/v1/tenants' });
  app.register(themesRoutes, { prefix: '/api/v1/themes' });
  app.register(onboardingRoutes, { prefix: '/api/v1/onboarding' });
  app.register(uploadsRoutes, { prefix: '/api/v1/uploads' });
  app.register(adminRoutes, { prefix: '/api/v1/admin' });

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

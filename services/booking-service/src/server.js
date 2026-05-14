require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
process.env.SERVICE_NAME = 'booking-service';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const { logger, middleware } = require('@hs/shared');

const bookingsRoutes = require('./routes/bookings');
const customersRoutes = require('./routes/customers');
const servicesRoutes = require('./routes/services');
const categoriesRoutes = require('./routes/categories');

const app = Fastify({ loggerInstance: logger });

async function start() {
  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });

  app.get('/health', async () => ({ status: 'ok', service: 'booking-service' }));

  // Express-style middleware bridge for Fastify: use preHandler.
  // Every authenticated route requires both tenant context AND auth.
  app.addHook('preHandler', async (req, reply) => {
    if (req.url === '/health') return;

    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) {
      reply.code(400).send({ error: 'x-tenant-id header required' });
      return reply;
    }
    req.tenantId = tenantId;

    // Lightweight inline JWT verification (gateway is the primary enforcer).
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'missing bearer token' });
      return reply;
    }
    try {
      const { jwt } = require('@hs/shared');
      const payload = jwt.verify(auth.slice(7));
      if (payload.tenantId !== tenantId) {
        reply.code(403).send({ error: 'tenant mismatch' });
        return reply;
      }
      req.user = payload;
    } catch {
      reply.code(401).send({ error: 'invalid token' });
      return reply;
    }
  });

  app.register(bookingsRoutes, { prefix: '/api/v1/bookings' });
  app.register(customersRoutes, { prefix: '/api/v1/customers' });
  app.register(servicesRoutes, { prefix: '/api/v1/services' });
  app.register(categoriesRoutes, { prefix: '/api/v1/categories' });

  const port = parseInt(process.env.BOOKING_SERVICE_PORT || '3003', 10);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`booking-service listening on :${port}`);
}

// Unused but kept for future Express-middleware re-use.
void middleware;

start().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});

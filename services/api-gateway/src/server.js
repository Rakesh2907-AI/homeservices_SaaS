require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
process.env.SERVICE_NAME = 'api-gateway';

const Fastify = require('fastify');
const cors = require('@fastify/cors');
const helmet = require('@fastify/helmet');
const rateLimit = require('@fastify/rate-limit');
const proxy = require('@fastify/http-proxy');
const { logger, cache, db, jwt: jwtUtil } = require('@hs/shared');

const TENANT_SVC = `http://localhost:${process.env.TENANT_SERVICE_PORT || 3001}`;
const AUTH_SVC = `http://localhost:${process.env.AUTH_SERVICE_PORT || 3002}`;
const BOOKING_SVC = `http://localhost:${process.env.BOOKING_SERVICE_PORT || 3003}`;

const app = Fastify({ logger, trustProxy: true });

async function start() {
  await app.register(helmet);
  await app.register(cors, { origin: true, credentials: true });

  // Tenant-aware rate limiting: bucket by tenant_id when known, else IP.
  await app.register(rateLimit, {
    max: 300,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.headers['x-tenant-id'] || req.ip,
    redis: cache.redis,
  });

  app.get('/health', async () => ({ status: 'ok', service: 'api-gateway' }));

  /**
   * Resolve tenant from host (subdomain or custom domain) and inject
   * `x-tenant-id` for downstream services. Cached for 5 min.
   */
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/health' || req.url.startsWith('/api/v1/tenants/signup')) return;

    const host = (req.headers.host || '').split(':')[0];
    const base = (process.env.APP_BASE_DOMAIN || 'localhost').split(':')[0];
    const subdomain = host.endsWith(`.${base}`) ? host.slice(0, -base.length - 1) : null;

    const cacheKey = cache.globalKey('tenant', subdomain ? 'sub' : 'domain', subdomain || host);
    const tenant = await cache.remember(cacheKey, 300, async () => {
      const { rows } = await db.withSuperAdmin((c) =>
        c.query(
          `SELECT tenant_id, plan_tier, is_active FROM tenants
           WHERE (subdomain=$1 OR custom_domain=$2) LIMIT 1`,
          [subdomain, host]
        )
      );
      return rows[0] || null;
    });

    if (!tenant) {
      reply.code(404).send({ error: 'tenant not found', host });
      return reply;
    }
    if (!tenant.is_active) {
      reply.code(403).send({ error: 'tenant inactive' });
      return reply;
    }
    req.headers['x-tenant-id'] = tenant.tenant_id;
  });

  /**
   * JWT verification — runs after tenant resolution. Public routes are excluded.
   */
  const PUBLIC = ['/health', '/api/v1/auth/login', '/api/v1/auth/refresh', '/api/v1/tenants/signup', '/api/v1/tenants/resolve'];
  app.addHook('preHandler', async (req, reply) => {
    if (PUBLIC.some((p) => req.url.startsWith(p))) return;

    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      reply.code(401).send({ error: 'missing bearer token' });
      return reply;
    }
    try {
      const payload = jwtUtil.verify(auth.slice(7));
      if (payload.tenantId !== req.headers['x-tenant-id']) {
        reply.code(403).send({ error: 'tenant mismatch' });
        return reply;
      }
      req.headers['x-user-id'] = payload.sub;
      req.headers['x-user-role'] = payload.role;
    } catch {
      reply.code(401).send({ error: 'invalid token' });
      return reply;
    }
  });

  // Reverse-proxy registrations
  await app.register(proxy, { upstream: TENANT_SVC, prefix: '/api/v1/tenants', rewritePrefix: '/api/v1/tenants' });
  await app.register(proxy, { upstream: TENANT_SVC, prefix: '/api/v1/themes', rewritePrefix: '/api/v1/themes' });
  await app.register(proxy, { upstream: AUTH_SVC, prefix: '/api/v1/auth', rewritePrefix: '/api/v1/auth' });
  await app.register(proxy, { upstream: BOOKING_SVC, prefix: '/api/v1/bookings', rewritePrefix: '/api/v1/bookings' });
  await app.register(proxy, { upstream: BOOKING_SVC, prefix: '/api/v1/customers', rewritePrefix: '/api/v1/customers' });
  await app.register(proxy, { upstream: BOOKING_SVC, prefix: '/api/v1/services', rewritePrefix: '/api/v1/services' });
  await app.register(proxy, { upstream: BOOKING_SVC, prefix: '/api/v1/categories', rewritePrefix: '/api/v1/categories' });

  const port = parseInt(process.env.API_GATEWAY_PORT || '3000', 10);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info(`api-gateway listening on :${port}`);
}

start().catch((err) => {
  logger.fatal({ err }, 'failed to start gateway');
  process.exit(1);
});

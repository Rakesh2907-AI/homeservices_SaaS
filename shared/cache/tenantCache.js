/**
 * Tenant-aware Redis cache. Every key is prefixed `<global>:t:<tenantId>:...`
 * so the namespace alone cannot leak across tenants.
 */
const Redis = require('ioredis');
const logger = require('../utils/logger');

const PREFIX = process.env.REDIS_PREFIX || 'hs';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on('error', (err) => logger.error({ err }, 'redis error'));

const key = (tenantId, ...parts) => `${PREFIX}:t:${tenantId}:${parts.join(':')}`;
const globalKey = (...parts) => `${PREFIX}:g:${parts.join(':')}`;

async function getJSON(k) {
  const v = await redis.get(k);
  return v ? JSON.parse(v) : null;
}

async function setJSON(k, value, ttlSeconds) {
  const payload = JSON.stringify(value);
  if (ttlSeconds) return redis.setex(k, ttlSeconds, payload);
  return redis.set(k, payload);
}

async function remember(k, ttlSeconds, loader) {
  const cached = await getJSON(k);
  if (cached !== null) return cached;
  const fresh = await loader();
  if (fresh !== undefined && fresh !== null) await setJSON(k, fresh, ttlSeconds);
  return fresh;
}

async function invalidateTenant(tenantId) {
  // SCAN > KEYS at scale — KEYS blocks the server.
  const pattern = `${PREFIX}:t:${tenantId}:*`;
  const stream = redis.scanStream({ match: pattern, count: 100 });
  for await (const keys of stream) {
    if (keys.length) await redis.del(...keys);
  }
}

module.exports = {
  redis,
  key,
  globalKey,
  getJSON,
  setJSON,
  remember,
  invalidateTenant,
};

const { db, cache } = require('@hs/shared');

module.exports = async function (app) {
  app.get('/health', async () => ({ status: 'ok', service: 'tenant-service', ts: Date.now() }));

  app.get('/ready', async (req, reply) => {
    try {
      await db.pool.query('SELECT 1');
      await cache.redis.ping();
      return { status: 'ready' };
    } catch (err) {
      reply.code(503);
      return { status: 'not-ready', error: err.message };
    }
  });
};

/**
 * Platform & content management endpoints — super-admin only.
 *
 * Mounted at /api/v1/admin to keep all super-admin endpoints under one prefix.
 * Each route checks the JWT for role: 'super_admin'.
 */
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { db, jwt: jwtUtil } = require('@hs/shared');

function requireSuperAdmin(req, reply) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'missing bearer token' });
    return false;
  }
  try {
    const payload = jwtUtil.verify(auth.slice(7));
    if (payload.role !== 'super_admin') {
      reply.code(403).send({ error: 'super_admin role required' });
      return false;
    }
    req.user = payload;
    return true;
  } catch {
    reply.code(401).send({ error: 'invalid token' });
    return false;
  }
}

/** Generic helper to crud a table by id. */
function attachCrud(app, mountPath, tableName, allowedFields, options = {}) {
  if (!options.skipList) {
    app.get(mountPath, async (req, reply) => {
      if (!requireSuperAdmin(req, reply)) return;
      return db.withSuperAdmin(async (c) => {
        const { rows } = await c.query(`SELECT * FROM ${tableName} ORDER BY ${options.orderBy || 'created_at DESC'}`);
        return { data: rows };
      });
    });
  }

  app.get(`${mountPath}/:id`, async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id])
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  app.post(mountPath, async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const body = req.body || {};
    const cols = [];
    const placeholders = [];
    const values = [];
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        values.push(typeof body[f] === 'object' && body[f] !== null ? JSON.stringify(body[f]) : body[f]);
        cols.push(f);
        placeholders.push(`$${values.length}`);
      }
    }
    if (!cols.length) { reply.code(400); return { error: 'no fields' }; }
    try {
      const { rows } = await db.withSuperAdmin((c) =>
        c.query(`INSERT INTO ${tableName} (${cols.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`, values)
      );
      reply.code(201);
      return rows[0];
    } catch (err) {
      reply.code(400); return { error: err.message };
    }
  });

  app.patch(`${mountPath}/:id`, async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const body = req.body || {};
    const sets = [];
    const values = [];
    for (const f of allowedFields) {
      if (body[f] !== undefined) {
        values.push(typeof body[f] === 'object' && body[f] !== null ? JSON.stringify(body[f]) : body[f]);
        sets.push(`${f} = $${values.length}`);
      }
    }
    if (!sets.length) { reply.code(400); return { error: 'no updates' }; }
    values.push(req.params.id);
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE ${tableName} SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values)
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  app.delete(`${mountPath}/:id`, async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { rowCount } = await db.withSuperAdmin((c) =>
      c.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id])
    );
    if (!rowCount) { reply.code(404); return { error: 'not found' }; }
    reply.code(204).send();
  });
}

module.exports = async function (app) {
  // ===== Announcements =====
  attachCrud(app, '/announcements', 'announcements',
    ['title', 'body', 'level', 'audience', 'audience_tenant_ids', 'is_active', 'starts_at', 'expires_at'],
    { orderBy: 'created_at DESC' }
  );

  // ===== Email templates =====
  attachCrud(app, '/email-templates', 'email_templates',
    ['template_key', 'name', 'subject', 'body_html', 'body_text', 'variables', 'is_active'],
    { orderBy: 'template_key' }
  );

  // ===== Theme presets =====
  attachCrud(app, '/theme-presets', 'theme_presets',
    ['slug', 'name', 'description', 'config', 'is_active', 'sort_order'],
    { orderBy: 'sort_order, name' }
  );

  // ===== API keys (custom — generate token on create, never return it again) =====
  app.get('/api-keys', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    return db.withSuperAdmin(async (c) => {
      const { rows } = await c.query(
        `SELECT id, name, key_prefix, scopes, last_used_at, expires_at, is_active, created_at
         FROM api_keys ORDER BY created_at DESC`
      );
      return { data: rows };
    });
  });

  app.post('/api-keys', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { name, scopes = [], expires_at } = req.body || {};
    if (!name) { reply.code(400); return { error: 'name required' }; }

    // Generate sk_live_<24 hex chars>
    const fullKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyPrefix = fullKey.slice(0, 16);
    const keyHash = bcrypt.hashSync(fullKey, 10);

    const { rows } = await db.withSuperAdmin((c) =>
      c.query(
        `INSERT INTO api_keys (name, key_prefix, key_hash, scopes, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, key_prefix, scopes, expires_at, created_at`,
        [name, keyPrefix, keyHash, JSON.stringify(scopes), expires_at || null, req.user.sub]
      )
    );
    reply.code(201);
    // ONLY time the plaintext key is returned.
    return { ...rows[0], plaintext: fullKey };
  });

  app.patch('/api-keys/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const { is_active } = req.body || {};
    if (typeof is_active !== 'boolean') { reply.code(400); return { error: 'is_active required' }; }
    const { rows } = await db.withSuperAdmin((c) =>
      c.query(`UPDATE api_keys SET is_active=$1, updated_at=NOW() WHERE id=$2 RETURNING id, is_active`, [is_active, req.params.id])
    );
    if (!rows[0]) { reply.code(404); return { error: 'not found' }; }
    return rows[0];
  });

  app.delete('/api-keys/:id', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    await db.withSuperAdmin((c) => c.query(`DELETE FROM api_keys WHERE id=$1`, [req.params.id]));
    reply.code(204).send();
  });

  // ===== Webhooks =====
  attachCrud(app, '/webhooks', 'webhooks',
    ['name', 'url', 'events', 'secret', 'is_active'],
    { orderBy: 'created_at DESC' }
  );

  // ===== Blog posts =====
  attachCrud(app, '/blog-posts', 'blog_posts',
    ['slug', 'title', 'excerpt', 'body', 'author', 'author_role', 'category', 'tags', 'read_time', 'is_published', 'published_at'],
    { orderBy: 'published_at DESC NULLS LAST, created_at DESC' }
  );

  // ===== Changelog entries =====
  attachCrud(app, '/changelog-entries', 'changelog_entries',
    ['version', 'title', 'tag', 'notes', 'released_at', 'is_published'],
    { orderBy: 'released_at DESC' }
  );

  // ===== Category templates (tree-aware list) =====
  app.get('/category-templates', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const industry = req.query.industry;
    return db.withSuperAdmin(async (c) => {
      const { rows } = industry
        ? await c.query('SELECT * FROM category_templates WHERE industry=$1 ORDER BY parent_id NULLS FIRST, sort_order, name', [industry])
        : await c.query('SELECT * FROM category_templates ORDER BY industry, parent_id NULLS FIRST, sort_order, name');
      return { data: rows };
    });
  });

  attachCrud(app, '/category-templates', 'category_templates',
    ['industry', 'name', 'description', 'parent_id', 'sort_order', 'is_active'],
    { orderBy: 'industry, sort_order', skipList: true }
  );

  // ===== Service templates =====
  attachCrud(app, '/service-templates', 'service_templates',
    ['category_template_id', 'title', 'description', 'default_price', 'default_duration_mins', 'default_pricing_rule', 'is_active'],
    { orderBy: 'title' }
  );

  // ===== System health (live introspection — no DB writes) =====
  app.get('/system-health', async (req, reply) => {
    if (!requireSuperAdmin(req, reply)) return;
    const startedAt = Date.now();

    const health = await db.withSuperAdmin(async (c) => {
      const pgVersion = await c.query('SELECT version() AS v');
      const pgStats = await c.query(`
        SELECT
          pg_database_size(current_database()) AS db_size_bytes,
          (SELECT count(*) FROM pg_stat_activity WHERE state='active') AS active_connections,
          (SELECT count(*) FROM pg_stat_activity) AS total_connections,
          (SELECT setting FROM pg_settings WHERE name='max_connections') AS max_connections
      `);
      const tableSizes = await c.query(`
        SELECT relname AS table_name, pg_total_relation_size(relid) AS bytes
        FROM pg_catalog.pg_statio_user_tables
        ORDER BY pg_total_relation_size(relid) DESC LIMIT 10
      `);
      const migrations = await c.query(`SELECT name, batch, migration_time FROM knex_migrations ORDER BY id DESC LIMIT 10`);

      return {
        postgres: {
          version: pgVersion.rows[0].v.split(',')[0],
          db_size_bytes: parseInt(pgStats.rows[0].db_size_bytes, 10),
          active_connections: parseInt(pgStats.rows[0].active_connections, 10),
          total_connections: parseInt(pgStats.rows[0].total_connections, 10),
          max_connections: parseInt(pgStats.rows[0].max_connections, 10),
        },
        top_tables: tableSizes.rows.map((r) => ({ table: r.table_name, bytes: parseInt(r.bytes, 10) })),
        recent_migrations: migrations.rows,
      };
    });

    // Redis ping
    let redisLatencyMs = null;
    let redisStatus = 'unknown';
    try {
      const { cache } = require('@hs/shared');
      const t = Date.now();
      await cache.redis.ping();
      redisLatencyMs = Date.now() - t;
      redisStatus = 'ok';
    } catch (err) {
      redisStatus = 'error';
    }

    return {
      ...health,
      redis: { status: redisStatus, latency_ms: redisLatencyMs },
      runtime: {
        node_version: process.version,
        uptime_seconds: Math.floor(process.uptime()),
        memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        env: process.env.NODE_ENV || 'development',
      },
      response_time_ms: Date.now() - startedAt,
      checked_at: new Date().toISOString(),
    };
  });
};

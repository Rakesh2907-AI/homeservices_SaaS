/**
 * Logo / asset upload. In dev we write to ./uploads/<tenant_id>/. In production
 * this would be replaced with an S3 PUT and the returned URL would point to
 * CloudFront — the public API stays identical.
 */
const path = require('path');
const fs = require('fs/promises');
const fsSync = require('fs');
const crypto = require('crypto');
const { db, cache } = require('@hs/shared');

const UPLOAD_DIR = path.resolve(__dirname, '../../../../uploads');
fsSync.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

module.exports = async function (app) {
  // multipart support is registered at the app level (see server.js)

  app.post('/logo', async (req, reply) => {
    const tenantId = req.headers['x-tenant-id'];
    if (!tenantId) { reply.code(400); return { error: 'tenant required' }; }

    const data = await req.file();
    if (!data) { reply.code(400); return { error: 'no file' }; }
    if (!ALLOWED.has(data.mimetype)) {
      reply.code(415);
      return { error: `mime ${data.mimetype} not allowed`, allowed: [...ALLOWED] };
    }

    const ext = data.mimetype.split('/')[1].replace('+xml', '');
    const filename = `${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const tenantDir = path.join(UPLOAD_DIR, tenantId);
    await fs.mkdir(tenantDir, { recursive: true });
    const filepath = path.join(tenantDir, filename);

    let total = 0;
    const chunks = [];
    for await (const chunk of data.file) {
      total += chunk.length;
      if (total > MAX_BYTES) {
        reply.code(413);
        return { error: 'file too large', max_bytes: MAX_BYTES };
      }
      chunks.push(chunk);
    }
    await fs.writeFile(filepath, Buffer.concat(chunks));

    const baseUrl = process.env.PUBLIC_ASSET_URL || `http://localhost:${process.env.TENANT_SERVICE_PORT || 3001}`;
    const url = `${baseUrl}/uploads/${tenantId}/${filename}`;

    await db.withTenant(tenantId, (c) =>
      c.query('UPDATE tenants SET logo_url=$1, updated_at=NOW() WHERE tenant_id=$2', [url, tenantId])
    );
    await Promise.all([
      cache.redis.del(cache.key(tenantId, 'theme')),
      cache.redis.del(cache.key(tenantId, 'config')),
    ]);

    return { url, size_bytes: total, mime: data.mimetype };
  });
};

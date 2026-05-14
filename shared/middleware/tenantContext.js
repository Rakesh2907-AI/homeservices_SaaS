/**
 * Resolves the tenant for the incoming request and attaches it to `req.tenant`.
 *
 * Resolution order:
 *   1. `x-tenant-id` header (used by gateway → service hops)
 *   2. Subdomain (e.g. `acme.example.com` → `acme`)
 *   3. Custom domain (e.g. `service.acmeplumbing.com`)
 *
 * The actual DB context is set per-query via `db.withTenant(...)` — never
 * left on a pooled connection across requests.
 */
const db = require('../db/client');
const cache = require('../cache/tenantCache');
const logger = require('../utils/logger');

const BASE_DOMAIN = process.env.APP_BASE_DOMAIN || 'localhost';

function extractSubdomain(host) {
  if (!host) return null;
  const hostname = host.split(':')[0];
  if (hostname === BASE_DOMAIN.split(':')[0]) return null;
  if (hostname.endsWith(`.${BASE_DOMAIN.split(':')[0]}`)) {
    return hostname.slice(0, hostname.length - BASE_DOMAIN.split(':')[0].length - 1);
  }
  return null; // possibly a custom domain — resolve below
}

async function loadTenant({ tenantId, subdomain, customDomain }) {
  const cacheKey = tenantId
    ? cache.globalKey('tenant', 'id', tenantId)
    : subdomain
      ? cache.globalKey('tenant', 'sub', subdomain)
      : cache.globalKey('tenant', 'domain', customDomain);

  return cache.remember(cacheKey, 300, async () => {
    const { rows } = await db.withSuperAdmin((client) =>
      client.query(
        `SELECT tenant_id, business_name, subdomain, custom_domain, plan_tier,
                logo_url, theme_config, settings, is_active
         FROM tenants
         WHERE ($1::uuid IS NULL OR tenant_id = $1)
           AND ($2::text IS NULL OR subdomain = $2)
           AND ($3::text IS NULL OR custom_domain = $3)
         LIMIT 1`,
        [tenantId || null, subdomain || null, customDomain || null]
      )
    );
    return rows[0] || null;
  });
}

function tenantContext({ required = true } = {}) {
  return async (req, res, next) => {
    try {
      const tenantHeader = req.headers['x-tenant-id'];
      const host = req.headers.host;
      const subdomain = extractSubdomain(host);

      let tenant = null;
      if (tenantHeader) tenant = await loadTenant({ tenantId: tenantHeader });
      else if (subdomain) tenant = await loadTenant({ subdomain });
      else if (host) tenant = await loadTenant({ customDomain: host.split(':')[0] });

      if (!tenant && required) {
        return res.status(404).json({ error: 'Tenant not found', host });
      }
      if (tenant && !tenant.is_active) {
        return res.status(403).json({ error: 'Tenant is inactive' });
      }

      req.tenant = tenant;
      req.tenantId = tenant?.tenant_id;
      next();
    } catch (err) {
      logger.error({ err }, 'tenantContext failed');
      next(err);
    }
  };
}

module.exports = tenantContext;

/**
 * Helpers for E2E tests. Tests assume the gateway + tenant-service + auth-service
 * + booking-service are running locally (the dev stack). We hit the gateway only,
 * since that's what the browser does.
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

async function adminLogin() {
  const { data } = await api('/api/v1/auth/admin-login', {
    method: 'POST',
    body: { email: 'super@servicehub.app', password: 'superadmin123' },
  });
  return data.accessToken;
}

async function tenantLogin(slug, email, password) {
  const { data } = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    headers: { 'x-tenant-slug': slug },
  });
  return data;
}

async function adminApi(token, path, opts = {}) {
  return api(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
}

async function tenantApi(token, slug, path, opts = {}) {
  return api(path, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      Authorization: `Bearer ${token}`,
      'x-tenant-slug': slug,
    },
  });
}

/** Unique slug for each test run so they don't collide. */
function uniqueSlug(prefix = 'test') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

module.exports = { API_BASE, api, adminLogin, tenantLogin, adminApi, tenantApi, uniqueSlug };

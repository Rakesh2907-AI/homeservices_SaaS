/**
 * Tiny fetch wrapper. Tenant resolution is done by Host header in production —
 * in local dev we send `x-tenant-slug` header that the gateway can use as a
 * fallback. The gateway already accepts subdomain-style hosts, but `localhost:3100`
 * doesn't carry a subdomain, so we also set the demo `acme.localhost` Host
 * via `x-forwarded-host` semantics — easier: send `Host` via the gateway proxy.
 *
 * For dev simplicity, we proxy via the Next.js dev server's same-origin rewrite
 * (configured in middleware/route handlers below) so the browser sends
 * cookies + auth headers naturally.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hs_token');
}
function getTenantSlug() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hs_tenant_slug');
}

async function request(path, { method = 'GET', body, headers = {}, isForm = false } = {}) {
  const token = getToken();
  const slug = getTenantSlug();

  const finalHeaders = { ...headers };
  if (token) finalHeaders.Authorization = `Bearer ${token}`;
  // Tell the gateway which tenant this request belongs to (dev-only fallback —
  // production uses real subdomains).
  if (slug) finalHeaders['x-tenant-slug'] = slug;
  if (!isForm && body && typeof body === 'object') finalHeaders['Content-Type'] = 'application/json';

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: finalHeaders,
    body: !body ? undefined : isForm ? body : JSON.stringify(body),
  });
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.details = data?.details;
    throw err;
  }
  return data;
}

export const api = {
  // ----- public -----
  signup: (body) => request('/api/v1/tenants/signup', { method: 'POST', body }),
  login: (body) => request('/api/v1/auth/login', { method: 'POST', body }),
  resolve: () => request('/api/v1/tenants/resolve'),
  themePresets: () => request('/api/v1/onboarding/presets'),

  // ----- authenticated -----
  onboardingStatus: () => request('/api/v1/onboarding/status'),
  completeStep: (step) => request(`/api/v1/onboarding/steps/${step}/complete`, { method: 'POST' }),
  updateBusiness: (body) => request('/api/v1/onboarding/business', { method: 'PUT', body }),
  updateTheme: (body) => request('/api/v1/themes', { method: 'PUT', body }),
  uploadLogo: (file) => {
    const form = new FormData();
    form.append('file', file);
    return request('/api/v1/uploads/logo', { method: 'POST', body: form, isForm: true });
  },

  listCategories: () => request('/api/v1/categories'),
  createCategoriesBulk: (items) => request('/api/v1/categories/bulk', { method: 'POST', body: { items } }),

  listServices: () => request('/api/v1/services'),
  createServicesBulk: (items) => request('/api/v1/services/bulk', { method: 'POST', body: { items } }),

  listCommissions: () => request('/api/v1/commissions'),
  createCommissionsBulk: (items) => request('/api/v1/commissions/bulk', { method: 'POST', body: { items } }),

  listBookings: () => request('/api/v1/bookings'),
};

export function setSession({ token, tenantSlug, user }) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('hs_token', token);
  if (tenantSlug) localStorage.setItem('hs_tenant_slug', tenantSlug);
  if (user) localStorage.setItem('hs_user', JSON.stringify(user));
}

export function getSession() {
  if (typeof window === 'undefined') return {};
  return {
    token: localStorage.getItem('hs_token'),
    tenantSlug: localStorage.getItem('hs_tenant_slug'),
    user: JSON.parse(localStorage.getItem('hs_user') || 'null'),
  };
}

export function clearSession() {
  if (typeof window === 'undefined') return;
  ['hs_token', 'hs_tenant_slug', 'hs_user'].forEach((k) => localStorage.removeItem(k));
}

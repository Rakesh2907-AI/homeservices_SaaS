/**
 * Public portal API client — no auth headers. Tenant is identified by slug
 * in the URL, so every request includes it as a path param.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

async function publicFetch(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export const portal = {
  getTenant: (slug) => publicFetch(`/api/v1/public/tenants/${slug}`),
  getCategories: (slug) => publicFetch(`/api/v1/public/tenants/${slug}/categories`),
  getServices: (slug, category) =>
    publicFetch(`/api/v1/public/tenants/${slug}/services${category ? `?category=${category}` : ''}`),
  getQuote: (slug, body) =>
    publicFetch(`/api/v1/public/tenants/${slug}/quote`, { method: 'POST', body: JSON.stringify(body) }),
  createBooking: (slug, body) =>
    publicFetch(`/api/v1/public/tenants/${slug}/bookings`, { method: 'POST', body: JSON.stringify(body) }),
};

/**
 * Apply the tenant's theme as CSS custom properties on <html>. Idempotent.
 */
export function applyTenantTheme(theme) {
  if (typeof document === 'undefined' || !theme) return;
  const root = document.documentElement;
  if (theme.primary_color)    root.style.setProperty('--brand-primary', theme.primary_color);
  if (theme.secondary_color)  root.style.setProperty('--brand-secondary', theme.secondary_color);
  if (theme.background_color) root.style.setProperty('--brand-bg', theme.background_color);
  if (theme.text_color)       root.style.setProperty('--brand-text', theme.text_color);
}

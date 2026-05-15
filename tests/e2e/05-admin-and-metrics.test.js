const { api, adminLogin, adminApi } = require('./helpers');

describe('Super admin and observability', () => {
  let token;
  beforeAll(async () => { token = await adminLogin(); });

  test('super admin login returns a usable token', async () => {
    expect(token).toBeTruthy();
    // /auth/me runs through the gateway's tenant resolver so it's not the right
    // probe for a tenant-less super-admin token. /admin/stats is super_admin-only
    // and bypasses tenant resolution — exactly what we want to verify.
    const { status, data } = await adminApi(token, '/api/v1/admin/stats');
    expect(status).toBe(200);
    expect(data.tenants).toBeGreaterThan(0);
  });

  test('admin stats endpoint returns platform-wide counts', async () => {
    const { status, data } = await adminApi(token, '/api/v1/admin/stats');
    expect(status).toBe(200);
    expect(data.tenants).toBeGreaterThan(0);
    expect(data.users).toBeGreaterThan(0);
  });

  test('admin listing endpoints return data', async () => {
    for (const path of ['/tenants', '/users', '/bookings', '/plans', '/theme-presets', '/email-templates', '/blog-posts', '/changelog-entries']) {
      const { status, data } = await adminApi(token, `/api/v1/admin${path}`);
      expect(status).toBe(200);
      expect(Array.isArray(data.data)).toBe(true);
    }
  });

  test('system-health returns live snapshot', async () => {
    const { status, data } = await adminApi(token, '/api/v1/admin/system-health');
    expect(status).toBe(200);
    expect(data.postgres.db_size_bytes).toBeGreaterThan(0);
    expect(data.redis.status).toBe('ok');
    expect(data.runtime.node_version).toMatch(/^v\d+/);
  });

  test('business admin token cannot access admin endpoints', async () => {
    // Sign up + log in as a normal business admin
    const { tenantLogin: tl, uniqueSlug: us } = require('./helpers');
    const slug = us('badm');
    await api('/api/v1/tenants/signup', {
      method: 'POST',
      body: {
        business_name: 'BA', subdomain: slug,
        admin_email: `a@${slug}.test`, admin_password: 'password123', admin_full_name: 'BA',
      },
    });
    const ba = await tl(slug, `a@${slug}.test`, 'password123');

    const { status } = await api('/api/v1/admin/stats', {
      headers: { Authorization: `Bearer ${ba.accessToken}` },
    });
    expect(status).toBe(403);
  });

  test('Prometheus /metrics endpoint exposes counters and histograms', async () => {
    for (const port of [3000, 3001, 3002, 3003]) {
      const res = await fetch(`http://localhost:${port}/metrics`);
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toMatch(/^# TYPE http_requests_total counter/m);
      expect(text).toMatch(/^# TYPE http_request_duration_seconds histogram/m);
    }
  });
});

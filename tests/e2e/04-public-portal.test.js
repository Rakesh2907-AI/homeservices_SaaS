const { api, tenantLogin, tenantApi, uniqueSlug } = require('./helpers');

/**
 * The customer-facing public portal flow: anonymous user resolves a tenant,
 * lists services, gets a live quote, and submits a booking — no auth needed.
 */
describe('Public portal flow', () => {
  const slug = uniqueSlug('portal');
  let token, serviceId;

  beforeAll(async () => {
    await api('/api/v1/tenants/signup', {
      method: 'POST',
      body: {
        business_name: 'Portal Test', subdomain: slug,
        admin_email: `admin@${slug}.test`, admin_password: 'password123',
        admin_full_name: 'Admin',
      },
    });
    token = (await tenantLogin(slug, `admin@${slug}.test`, 'password123')).accessToken;

    const cat = await tenantApi(token, slug, '/api/v1/categories', {
      method: 'POST', body: { name: 'Public-test' },
      headers: { 'x-user-role': 'business_admin' },
    });
    const svc = await tenantApi(token, slug, '/api/v1/services', {
      method: 'POST',
      body: { category_id: cat.data.id, title: 'Public-test service', base_price: 99, duration_mins: 60 },
      headers: { 'x-user-role': 'business_admin' },
    });
    serviceId = svc.data.id;
  });

  test('public can resolve the tenant by slug', async () => {
    const { status, data } = await api(`/api/v1/public/tenants/${slug}`);
    expect(status).toBe(200);
    expect(data.business_name).toBe('Portal Test');
    expect(data.tenant_id).toBeTruthy();
    expect(data.theme_config).toBeDefined();
  });

  test('public sees only published categories + services', async () => {
    const cats = await api(`/api/v1/public/tenants/${slug}/categories`);
    expect(cats.status).toBe(200);
    expect(cats.data.data.length).toBeGreaterThan(0);

    const svcs = await api(`/api/v1/public/tenants/${slug}/services`);
    expect(svcs.status).toBe(200);
    expect(svcs.data.data.some((s) => s.id === serviceId)).toBe(true);
  });

  test('non-existent slug returns 404', async () => {
    const { status } = await api('/api/v1/public/tenants/does-not-exist');
    expect(status).toBe(404);
  });

  test('public quote endpoint returns full pricing breakdown', async () => {
    const { status, data } = await api(`/api/v1/public/tenants/${slug}/quote`, {
      method: 'POST',
      body: { service_id: serviceId, context: { after_hours: true } },
    });
    expect(status).toBe(200);
    expect(data.quote.line_items.length).toBeGreaterThanOrEqual(2); // base + after-hours
    expect(data.quote.total).toBeGreaterThan(99); // surcharge applied
  });

  test('anonymous booking creates customer + booking', async () => {
    const { status, data } = await api(`/api/v1/public/tenants/${slug}/bookings`, {
      method: 'POST',
      body: {
        service_id: serviceId,
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        customer: { full_name: 'Jane Public', email: 'jane@public.test', phone: '+1-555-1234' },
        notes: 'Side gate is unlocked',
        quoted_price: 99,
      },
    });
    expect(status).toBe(201);
    expect(data.id).toBeTruthy();
    expect(data.status).toBe('pending');
    expect(parseFloat(data.quoted_price)).toBe(99);
  });

  test('the booking is visible to the business admin', async () => {
    const { data } = await tenantApi(token, slug, '/api/v1/bookings');
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data.some((b) => b.notes === 'Side gate is unlocked')).toBe(true);
  });
});

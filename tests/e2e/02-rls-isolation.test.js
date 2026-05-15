const { api, tenantLogin, tenantApi, uniqueSlug } = require('./helpers');

/**
 * The most important test in the suite: prove that one tenant cannot see
 * another tenant's data, no matter what they try.
 */
describe('RLS isolation between tenants', () => {
  const slugA = uniqueSlug('rls-a');
  const slugB = uniqueSlug('rls-b');
  let tokenA, tokenB, categoryIdA, serviceIdA;

  beforeAll(async () => {
    for (const slug of [slugA, slugB]) {
      await api('/api/v1/tenants/signup', {
        method: 'POST',
        body: {
          business_name: `${slug} Co`, subdomain: slug,
          admin_email: `admin@${slug}.test`, admin_password: 'password123',
          admin_full_name: 'Admin',
        },
      });
    }
    tokenA = (await tenantLogin(slugA, `admin@${slugA}.test`, 'password123')).accessToken;
    tokenB = (await tenantLogin(slugB, `admin@${slugB}.test`, 'password123')).accessToken;

    // Tenant A creates a category and service.
    const catRes = await tenantApi(tokenA, slugA, '/api/v1/categories', {
      method: 'POST', body: { name: 'A-only category' },
      headers: { 'x-user-role': 'business_admin' },
    });
    categoryIdA = catRes.data.id;

    const svcRes = await tenantApi(tokenA, slugA, '/api/v1/services', {
      method: 'POST',
      body: { category_id: categoryIdA, title: 'A-only service', base_price: 100 },
      headers: { 'x-user-role': 'business_admin' },
    });
    serviceIdA = svcRes.data.id;
  });

  test("tenant A's categories are visible to A", async () => {
    const { data } = await tenantApi(tokenA, slugA, '/api/v1/categories');
    expect(data.data.some((c) => c.id === categoryIdA)).toBe(true);
  });

  test("tenant A's category is INVISIBLE to tenant B", async () => {
    const { data } = await tenantApi(tokenB, slugB, '/api/v1/categories');
    expect(data.data.some((c) => c.id === categoryIdA)).toBe(false);
  });

  test("tenant A's service is INVISIBLE to tenant B", async () => {
    const { data } = await tenantApi(tokenB, slugB, '/api/v1/services');
    expect(data.data.some((s) => s.id === serviceIdA)).toBe(false);
  });

  test("using A's token against B's subdomain is rejected at the gateway", async () => {
    const { status, data } = await tenantApi(tokenA, slugB, '/api/v1/categories');
    expect(status).toBe(403);
    expect(data.error).toMatch(/tenant mismatch/i);
  });

  test('unauthenticated request to a tenant-scoped endpoint is rejected', async () => {
    const { status } = await api('/api/v1/categories', { headers: { 'x-tenant-slug': slugA } });
    expect(status).toBe(401);
  });
});

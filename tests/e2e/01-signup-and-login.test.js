const { api, tenantLogin, uniqueSlug } = require('./helpers');

describe('Signup → login flow', () => {
  const slug = uniqueSlug('signup');
  const email = `admin@${slug}.test`;

  test('a new tenant can sign up', async () => {
    const { status, data } = await api('/api/v1/tenants/signup', {
      method: 'POST',
      body: {
        business_name: `Test Co ${slug}`,
        subdomain: slug,
        admin_email: email,
        admin_password: 'password123',
        admin_full_name: 'Test Admin',
        plan_tier: 'basic',
      },
    });
    expect(status).toBe(201);
    expect(data.tenant_id).toBeTruthy();
    expect(data.subdomain).toBe(slug);
  });

  test('the newly-created admin can log in and receives a JWT', async () => {
    const data = await tenantLogin(slug, email, 'password123');
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe('business_admin');
  });

  test('login with wrong password is rejected', async () => {
    const { status, data } = await api('/api/v1/auth/login', {
      method: 'POST',
      body: { email, password: 'wrong' },
      headers: { 'x-tenant-slug': slug },
    });
    expect(status).toBe(401);
    expect(data.error).toMatch(/invalid/i);
  });

  test('signup with a duplicate subdomain is rejected', async () => {
    const { status } = await api('/api/v1/tenants/signup', {
      method: 'POST',
      body: {
        business_name: 'Other Test Co', subdomain: slug,
        admin_email: 'x@example.com', admin_password: 'password123',
        admin_full_name: 'Other Admin',
      },
    });
    expect(status).toBe(409);
  });
});

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setSession } from '@/lib/api';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: '',
    subdomain: '',
    admin_full_name: '',
    admin_email: '',
    admin_password: '',
    plan_tier: 'basic',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function update(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // 1. Create the tenant + admin user
      await api.signup(form);

      // 2. Log in immediately to get a token
      const slug = form.subdomain;
      setSession({ tenantSlug: slug });
      const login = await api.login({ email: form.admin_email, password: form.admin_password });
      setSession({ token: login.accessToken, tenantSlug: slug, user: login.user });

      // 3. Off to the onboarding wizard
      router.push('/onboarding/theme');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full card">
        <h1 className="text-2xl font-bold mb-1">Create your business account</h1>
        <p className="text-sm text-gray-600 mb-6">Takes about 3 minutes.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Business name</label>
            <input className="input" required value={form.business_name} onChange={update('business_name')} placeholder="Acme Plumbing" />
          </div>
          <div>
            <label className="label">Subdomain (your URL)</label>
            <div className="flex">
              <input
                className="input rounded-r-none"
                required pattern="[a-z0-9-]+"
                value={form.subdomain}
                onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value.toLowerCase() }))}
                placeholder="acme"
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-sm text-gray-500">
                .homeservices.app
              </span>
            </div>
          </div>
          <div>
            <label className="label">Your name</label>
            <input className="input" required value={form.admin_full_name} onChange={update('admin_full_name')} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.admin_email} onChange={update('admin_email')} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required minLength={8} value={form.admin_password} onChange={update('admin_password')} />
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="input" value={form.plan_tier} onChange={update('plan_tier')}>
              <option value="basic">Basic — $29/mo</option>
              <option value="pro">Pro — $99/mo</option>
              <option value="enterprise">Enterprise — $499/mo</option>
            </select>
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Creating…' : 'Create account & continue →'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          Already have an account? <Link href="/login" className="underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, setSession } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ subdomain: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      setSession({ tenantSlug: form.subdomain });
      const login = await api.login({ email: form.email, password: form.password });
      setSession({ token: login.accessToken, tenantSlug: form.subdomain, user: login.user });

      // Resume onboarding if incomplete, else go to dashboard
      const status = await api.onboardingStatus().catch(() => null);
      if (status?.onboarding_status?.completed) router.push('/dashboard');
      else router.push(`/onboarding/${status?.onboarding_status?.current_step || 'theme'}`);
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full card">
        <h1 className="text-2xl font-bold mb-1">Sign in</h1>
        <p className="text-sm text-gray-600 mb-6">Welcome back.</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Business subdomain</label>
            <input className="input" required pattern="[a-z0-9-]+"
              value={form.subdomain}
              onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value.toLowerCase() }))}
              placeholder="acme" />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-4">
          No account? <Link href="/signup" className="underline">Create one</Link>
        </p>
      </div>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (typeof window !== 'undefined') {
        localStorage.setItem('hs_admin_token', data.accessToken);
        localStorage.setItem('hs_admin_user', JSON.stringify(data.user));
      }
      router.push('/admin');
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Decorative ambient glows */}
      <div aria-hidden className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-blue-500 blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-cyan-500 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
      </div>

      {/* Dot grid */}
      <div aria-hidden className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
      }} />

      <div className="relative max-w-md w-full">
        {/* Brand mark */}
        <Link href="/" className="flex items-center justify-center gap-2 font-semibold text-white mb-8">
          <span className="inline-block h-9 w-9 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400" />
          <span className="text-lg">ServiceHub</span>
        </Link>

        <div className="rounded-2xl border border-gray-700/50 bg-gray-800/80 backdrop-blur p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-1">
            <Icon.Shield className="h-6 w-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white">Super admin</h1>
          </div>
          <p className="text-sm text-gray-400 mb-6">Platform operator console. This is not for business owners — they sign in via their own subdomain.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-md border border-gray-600 bg-gray-900/60 text-white px-3 py-2.5 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                placeholder="super@servicehub.app"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-md border border-gray-600 bg-gray-900/60 text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>

            {error && (
              <div className="rounded-md bg-rose-500/10 border border-rose-500/30 px-3 py-2 text-sm text-rose-300">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={busy}
              className="w-full rounded-md bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium py-2.5 hover:from-blue-600 hover:to-cyan-600 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {busy ? 'Signing in…' : 'Sign in to admin console'}
            </button>
          </form>

          <p className="mt-6 text-xs text-gray-500 text-center">
            Looking for the business dashboard? <Link href="/login" className="underline text-gray-300">Sign in here</Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-gray-500">
          Dev credentials: <code className="font-mono">super@servicehub.app</code> / <code className="font-mono">superadmin123</code>
        </p>
      </div>
    </main>
  );
}

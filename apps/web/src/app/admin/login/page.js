'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

// Sandbox credentials banner is shown unless explicitly disabled
// (set NEXT_PUBLIC_SHOW_SANDBOX_CREDS=false for production deploys).
const SHOW_SANDBOX = process.env.NEXT_PUBLIC_SHOW_SANDBOX_CREDS !== 'false';
const SANDBOX = {
  email: 'super@servicehub.app',
  password: 'superadmin123',
};

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null); // 'email' | 'password' | null
  const [showPassword, setShowPassword] = useState(false);

  function useSandbox() {
    setForm({ ...SANDBOX });
    setError(null);
  }

  async function copyField(field) {
    try {
      await navigator.clipboard.writeText(SANDBOX[field]);
      setCopied(field);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* older browsers — user can still click "Use sandbox creds" */
    }
  }

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

  async function quickSignIn() {
    setForm({ ...SANDBOX });
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(SANDBOX),
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
    <main className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
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

        {/* ===== SANDBOX CREDENTIALS BANNER ===== */}
        {SHOW_SANDBOX && (
          <div className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 backdrop-blur p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 h-8 w-8 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                <span className="text-amber-300 text-sm font-bold">🧪</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold text-amber-100">Sandbox environment</h3>
                  <span className="text-[10px] uppercase tracking-wider rounded-full bg-amber-500/20 text-amber-200 px-2 py-0.5 font-semibold">demo</span>
                </div>
                <p className="text-xs text-amber-200/80 mt-1">Use the test credentials below to explore the admin console. Read/write actions affect demo data only.</p>

                <div className="mt-3 space-y-2">
                  <CredentialRow
                    label="Email"
                    value={SANDBOX.email}
                    copied={copied === 'email'}
                    onCopy={() => copyField('email')}
                  />
                  <CredentialRow
                    label="Password"
                    value={SANDBOX.password}
                    copied={copied === 'password'}
                    onCopy={() => copyField('password')}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button" onClick={useSandbox}
                    className="text-xs rounded-md border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-amber-100 font-medium transition"
                  >
                    Fill the form
                  </button>
                  <button
                    type="button" onClick={quickSignIn} disabled={busy}
                    className="text-xs rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 px-3 py-1.5 text-white font-semibold transition disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {busy ? 'Signing in…' : 'Sign in instantly'}
                    <Icon.ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} required value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-md border border-gray-600 bg-gray-900/60 text-white px-3 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  autoComplete="current-password"
                />
                <button
                  type="button" onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-200 px-2 py-1 rounded"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
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

        {SHOW_SANDBOX && (
          <p className="mt-6 text-center text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
            🔒 The sandbox banner is hidden in production by setting{' '}
            <code className="font-mono text-gray-400">NEXT_PUBLIC_SHOW_SANDBOX_CREDS=false</code>.
          </p>
        )}
      </div>
    </main>
  );
}

/* ---------- internal: a copyable, monospaced credential row ---------- */
function CredentialRow({ label, value, copied, onCopy }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/20 bg-gray-900/40 px-3 py-2">
      <span className="text-[10px] uppercase tracking-wider text-amber-300/70 font-semibold w-16 flex-shrink-0">{label}</span>
      <code className="flex-1 font-mono text-xs text-amber-100 truncate select-all">{value}</code>
      <button
        type="button" onClick={onCopy}
        className="text-[11px] rounded border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-amber-200 transition inline-flex items-center gap-1 min-w-[58px] justify-center"
        title={`Copy ${label.toLowerCase()}`}
      >
        {copied ? (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
            Copied
          </>
        ) : (
          <>
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  );
}

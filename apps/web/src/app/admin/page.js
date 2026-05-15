'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';
import AnimatedCounter from '@/components/marketing/AnimatedCounter';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000';

function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('hs_admin_token');
}

async function adminFetch(path, opts = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin/login'); return; }
    setUser(JSON.parse(localStorage.getItem('hs_admin_user') || 'null'));
    Promise.all([
      adminFetch('/api/v1/admin/stats'),
      adminFetch('/api/v1/admin/tenants'),
    ]).then(([s, t]) => {
      setStats(s);
      setTenants(t.data);
    }).catch((e) => {
      setError(e.message);
      if (/invalid token|missing bearer/i.test(e.message)) router.push('/admin/login');
    });
  }, [router]);

  function logout() {
    localStorage.removeItem('hs_admin_token');
    localStorage.removeItem('hs_admin_user');
    router.push('/admin/login');
  }

  async function toggleActive(tenantId, currentActive) {
    try {
      await adminFetch(`/api/v1/admin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      setTenants((prev) => prev.map((t) => t.tenant_id === tenantId ? { ...t, is_active: !currentActive } : t));
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400" />
            <div>
              <div className="font-semibold">ServiceHub <span className="text-cyan-400">Admin</span></div>
              <div className="text-xs text-gray-400">Platform operator console</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300 hidden sm:inline">{user?.email}</span>
            <button onClick={logout} className="rounded-md bg-gray-800 hover:bg-gray-700 text-sm px-3 py-1.5">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
        )}

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Platform overview</h1>
        <p className="text-gray-600 mb-8">Live state across every tenant on ServiceHub.</p>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            ['Tenants', stats?.tenants ?? 0, 'from-blue-500 to-cyan-500'],
            ['Users', stats?.users ?? 0, 'from-violet-500 to-purple-500'],
            ['Bookings', stats?.bookings ?? 0, 'from-emerald-500 to-teal-500'],
            ['Services', stats?.services ?? 0, 'from-amber-500 to-orange-500'],
          ].map(([label, value, grad]) => (
            <div key={label} className="relative rounded-xl border border-gray-200 bg-white p-6 overflow-hidden">
              <div aria-hidden className={`absolute -top-12 -right-12 h-24 w-24 rounded-full bg-gradient-to-br ${grad} opacity-20 blur-2xl`} />
              <div className="relative">
                <div className="text-sm text-gray-500">{label}</div>
                <div className="text-3xl font-bold gradient-text mt-1"><AnimatedCounter value={String(value)} /></div>
              </div>
            </div>
          ))}
        </div>

        {/* Plan mix + Tenant list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Plan distribution</h2>
            <div className="space-y-3">
              {stats?.plan_mix?.length ? stats.plan_mix.map((p) => {
                const total = stats.plan_mix.reduce((s, r) => s + r.n, 0) || 1;
                const pct = Math.round((p.n / total) * 100);
                return (
                  <div key={p.plan_tier}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-gray-900 capitalize">{p.plan_tier}</span>
                      <span className="text-gray-500">{p.n} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              }) : <p className="text-sm text-gray-500">No active tenants yet.</p>}
            </div>
          </div>

          <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">All tenants</h2>
              <span className="text-xs text-gray-500">{tenants.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                    <th className="px-6 py-3">Business</th>
                    <th className="px-6 py-3">Plan</th>
                    <th className="px-6 py-3 text-right">Users</th>
                    <th className="px-6 py-3 text-right">Bookings</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenants.map((t) => (
                    <tr key={t.tenant_id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-900">{t.business_name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Icon.Globe className="h-3 w-3" />
                          {t.subdomain}.servicehub.app
                          {t.onboarded === 'true' && (
                            <span className="ml-2 text-emerald-600 text-xs">✓ onboarded</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3"><span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium capitalize">{t.plan_tier}</span></td>
                      <td className="px-6 py-3 text-right font-mono">{t.user_count}</td>
                      <td className="px-6 py-3 text-right font-mono">{t.booking_count}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${t.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                          <span className={`h-2 w-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                          {t.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button onClick={() => toggleActive(t.tenant_id, t.is_active)} className="text-xs text-blue-600 hover:underline">
                          {t.is_active ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tenants.length === 0 && (
                    <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No tenants yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

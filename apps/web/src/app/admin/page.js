'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell, { StatCard } from '@/components/admin/AdminShell';
import MiniChart from '@/components/admin/MiniChart';
import AnimatedCounter from '@/components/marketing/AnimatedCounter';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/v1/admin/stats'),
      adminFetch('/api/v1/admin/charts/timeseries?days=30'),
      adminFetch('/api/v1/admin/tenants?limit=5'),
      adminFetch('/api/v1/admin/audit-logs?limit=10'),
    ]).then(([s, c, t, a]) => {
      setStats(s);
      setCharts(c);
      setRecentTenants(t.data);
      setRecentAudit(a.data);
    }).catch((e) => setError(e.message));
  }, []);

  const planTotal = stats?.plan_mix?.reduce((s, r) => s + r.n, 0) || 1;
  const signupsTotal = charts?.signups?.reduce((s, d) => s + d.n, 0) || 0;
  const bookingsTotal = charts?.bookings?.reduce((s, d) => s + d.n, 0) || 0;

  return (
    <AdminShell title="Overview" subtitle="Live state of the ServiceHub platform.">
      {error && (
        <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* Stat tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Tenants" value={<AnimatedCounter value={String(stats?.tenants ?? 0)} />} gradient="from-blue-500 to-cyan-500" Ico={Icon.Globe} hint="active businesses" />
        <StatCard label="Users" value={<AnimatedCounter value={String(stats?.users ?? 0)} />} gradient="from-violet-500 to-purple-500" Ico={Icon.Shield} hint="across all tenants" />
        <StatCard label="Bookings" value={<AnimatedCounter value={String(stats?.bookings ?? 0)} />} gradient="from-emerald-500 to-teal-500" Ico={Icon.Calendar} hint="lifetime" />
        <StatCard label="Services" value={<AnimatedCounter value={String(stats?.services ?? 0)} />} gradient="from-amber-500 to-orange-500" Ico={Icon.Bolt} hint="configured" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Tenant signups</div>
              <div className="text-2xl font-bold mt-0.5">{signupsTotal}</div>
              <div className="text-xs text-gray-500">last 30 days</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center">
              <Icon.Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <MiniChart data={charts?.signups || []} color="#2563eb" height={100} showAxis />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Bookings</div>
              <div className="text-2xl font-bold mt-0.5">{bookingsTotal}</div>
              <div className="text-xs text-gray-500">last 30 days</div>
            </div>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center">
              <Icon.Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <MiniChart data={charts?.bookings || []} color="#10b981" height={100} showAxis />
          </div>
        </div>
      </div>

      {/* Plan distribution + recent tenants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4">Plan distribution</h2>
          <div className="space-y-3">
            {stats?.plan_mix?.length ? stats.plan_mix.map((p) => {
              const pct = Math.round((p.n / planTotal) * 100);
              return (
                <div key={p.plan_tier}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{p.plan_tier}</span>
                    <span className="text-gray-500">{p.n} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            }) : <p className="text-sm text-gray-500">No active tenants.</p>}
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold">Recent tenants</h2>
            <Link href="/admin/tenants" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {recentTenants.map((t) => (
                <tr key={t.tenant_id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/admin/tenants/${t.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.business_name}</Link>
                    <div className="text-xs text-gray-500">{t.subdomain}.servicehub.app</div>
                  </td>
                  <td className="px-6 py-3"><span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium capitalize">{t.plan_tier}</span></td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentTenants.length === 0 && (
                <tr><td className="px-6 py-8 text-center text-sm text-gray-500">No tenants yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link href="/admin/audit-logs" className="text-xs text-blue-600 hover:underline">View all →</Link>
        </div>
        {recentAudit.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-gray-500">No recent activity yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentAudit.map((a) => (
              <li key={a.id} className="px-6 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 font-bold ${
                    a.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                    a.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                    a.action === 'DELETE' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                  }`}>{a.action}</span>
                  <span className="font-medium truncate">{a.entity_type}</span>
                  <span className="text-gray-500 truncate">by {a.actor_email || a.actor_id?.slice(0, 8) || 'system'}</span>
                  <span className="text-gray-400 truncate">on {a.subdomain}</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AdminShell>
  );
}

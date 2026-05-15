'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import MiniChart from '@/components/admin/MiniChart';
import { KpiCard, SectionHeader, EmptyState, Badge, money } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/v1/admin/stats'),
      adminFetch('/api/v1/admin/revenue/summary'),
      adminFetch('/api/v1/admin/charts/timeseries?days=30'),
      adminFetch('/api/v1/admin/tenants?limit=5'),
      adminFetch('/api/v1/admin/audit-logs?limit=8'),
    ]).then(([s, r, c, t, a]) => {
      setStats(s); setRevenue(r); setCharts(c);
      setRecentTenants(t.data); setRecentAudit(a.data);
    }).catch((e) => setError(e.message));
  }, []);

  const planTotal = revenue?.plan_mix?.reduce((s, r) => s + r.subs, 0) || 1;

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform"
          title="Welcome back, super admin"
          description="A high-level pulse of ServiceHub. Drill into any tile for the full picture."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Overview' }]}
          actions={
            <Link href="/admin/notifications" className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400 transition">
              <Icon.MessageCircle className="h-4 w-4" /> Inbox
            </Link>
          }
        />
      }
    >
      {error && <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <KpiCard label="Monthly recurring revenue" value={money(revenue?.mrr_cents)} hint="across active subscriptions" gradient="from-emerald-500 to-teal-500" Ico={Icon.Dollar} />
        <KpiCard label="Active subscriptions"      value={revenue?.active_subscriptions ?? '—'} hint={`ARPU ${money(revenue?.arpu_cents)}`} gradient="from-blue-500 to-cyan-500" Ico={Icon.Shield} />
        <KpiCard label="Outstanding invoices"      value={money(revenue?.outstanding_cents)} hint={`${revenue?.outstanding_count ?? 0} invoices`} gradient="from-amber-500 to-orange-500" Ico={Icon.Newspaper} />
        <KpiCard label="Churn (30d)"               value={`${revenue?.churn_rate_pct ?? 0}%`} hint={`${revenue?.canceled_30d ?? 0} canceled`} gradient="from-rose-500 to-pink-500" Ico={Icon.Bolt} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Tenant signups" subtitle="last 30 days" total={charts?.signups?.reduce((s, d) => s + d.n, 0)} data={charts?.signups} color="#2563eb" Ico={Icon.Globe} />
        <ChartCard title="Bookings"       subtitle="last 30 days" total={charts?.bookings?.reduce((s, d) => s + d.n, 0)} data={charts?.bookings} color="#10b981" Ico={Icon.Calendar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <SectionHeader title="Revenue by plan" description="MRR contribution across active tiers." />
          {revenue?.plan_mix?.length ? (
            <div className="space-y-3">
              {revenue.plan_mix.map((p) => {
                const pct = Math.round((p.subs / planTotal) * 100);
                return (
                  <div key={p.plan_name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{p.plan_name}</span>
                      <span className="text-gray-500 font-mono">{money(p.mrr_cents)}/mo</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.max(pct, 3)}%` }} />
                    </div>
                    <div className="mt-1 text-xs text-gray-500">{p.subs} subscribers · {pct}%</div>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-sm text-gray-500">No active subscriptions yet.</p>}
        </div>

        <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <SectionHeader
              title="Latest tenants"
              description="The 5 most recent businesses to join the platform."
              action={<Link href="/admin/tenants" className="text-sm text-blue-600 hover:underline whitespace-nowrap">View all →</Link>}
            />
          </div>
          {recentTenants.length === 0 ? (
            <div className="p-6"><EmptyState title="No tenants yet" description="When a business signs up, they'll show up here." /></div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {recentTenants.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/tenants/${t.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.business_name}</Link>
                      <div className="text-xs text-gray-500">{t.subdomain}.servicehub.app</div>
                    </td>
                    <td className="px-6 py-3"><Badge variant="blue">{t.plan_tier}</Badge></td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs text-gray-500">{t.user_count}u · {t.booking_count}b</span>
                      <div className="text-[10px] text-gray-400 mt-0.5">{new Date(t.created_at).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white">
        <div className="px-6 py-4 border-b border-gray-100">
          <SectionHeader
            title="Recent activity"
            description="Most recent operator and tenant actions, recorded in the audit log."
            action={<Link href="/admin/audit-logs" className="text-sm text-blue-600 hover:underline whitespace-nowrap">View all →</Link>}
          />
        </div>
        {recentAudit.length === 0 ? (
          <div className="p-8"><EmptyState title="Nothing here yet" description="Activity will appear once tenants start using the platform." /></div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {recentAudit.map((a) => (
              <li key={a.id} className="px-6 py-3 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={a.action === 'CREATE' ? 'green' : a.action === 'UPDATE' ? 'blue' : a.action === 'DELETE' ? 'red' : 'gray'}>{a.action}</Badge>
                  <span className="font-medium truncate">{a.entity_type}</span>
                  <span className="text-gray-500 truncate">by {a.actor_email || 'system'}</span>
                  <span className="text-gray-400 truncate">on <strong>{a.subdomain}</strong></span>
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

function ChartCard({ title, subtitle, total, data, color, Ico }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-gray-900">{total ?? '—'}</span>
            <span className="text-xs text-gray-500">{subtitle}</span>
          </div>
        </div>
        {Ico && <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 text-gray-600 flex items-center justify-center"><Ico className="h-4 w-4" /></div>}
      </div>
      <div className="mt-4"><MiniChart data={data || []} color={color} height={100} showAxis /></div>
    </div>
  );
}

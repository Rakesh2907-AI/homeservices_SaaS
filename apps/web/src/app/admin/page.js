'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import MiniChart from '@/components/admin/MiniChart';
import {
  Button, Card, CardHeader, KpiCard, SectionHeader, EmptyState, Badge, Skeleton, money,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [charts, setCharts] = useState(null);
  const [recentTenants, setRecentTenants] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/v1/admin/stats'),
      adminFetch('/api/v1/admin/revenue/summary'),
      adminFetch('/api/v1/admin/charts/timeseries?days=30'),
      adminFetch('/api/v1/admin/tenants?limit=5'),
      adminFetch('/api/v1/admin/audit-logs?limit=6'),
    ]).then(([s, r, c, t, a]) => {
      setStats(s); setRevenue(r); setCharts(c);
      setRecentTenants(t.data); setRecentAudit(a.data);
      setLoading(false);
    }).catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const planTotal = revenue?.plan_mix?.reduce((s, r) => s + r.subs, 0) || 1;

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform overview"
          title="Welcome back"
          description="A high-level pulse of ServiceHub — recurring revenue, growth, and what's happening right now."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Overview' }]}
          actions={
            <>
              <Button href="/admin/audit-logs" variant="ghost" size="sm">
                <Icon.Newspaper className="h-3.5 w-3.5" /> Audit log
              </Button>
              <Button href="/admin/revenue" variant="primary" size="sm">
                <Icon.Chart className="h-3.5 w-3.5" /> View revenue
              </Button>
            </>
          }
        />
      }
    >
      {error && (
        <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      )}

      {/* KPI ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monthly recurring revenue" value={money(revenue?.mrr_cents)} hint="across all active subs" accent="emerald" Ico={Icon.Dollar} loading={loading} />
        <KpiCard label="Active subscriptions"      value={revenue?.active_subscriptions ?? '—'} hint={`ARPU ${money(revenue?.arpu_cents)}`} accent="blue" Ico={Icon.Shield} loading={loading} />
        <KpiCard label="Outstanding invoices"      value={money(revenue?.outstanding_cents)} hint={`${revenue?.outstanding_count ?? 0} unpaid`} accent="amber" Ico={Icon.Newspaper} loading={loading} />
        <KpiCard label="Churn (30d)"               value={`${revenue?.churn_rate_pct ?? 0}%`} hint={`${revenue?.canceled_30d ?? 0} canceled`} accent="rose" Ico={Icon.Bolt} loading={loading} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <ChartCard title="Tenant signups" subtitle="last 30 days" total={charts?.signups?.reduce((s, d) => s + d.n, 0)} data={charts?.signups} color="#2563eb" Ico={Icon.Globe} loading={loading} />
        <ChartCard title="Bookings"       subtitle="last 30 days" total={charts?.bookings?.reduce((s, d) => s + d.n, 0)} data={charts?.bookings} color="#10b981" Ico={Icon.Calendar} loading={loading} />
      </div>

      {/* THREE-COLUMN LOWER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        {/* Revenue by plan */}
        <Card>
          <CardHeader title="Revenue by plan" description="MRR contribution across active tiers." />
          <div className="mt-5">
            {loading ? (
              <div className="space-y-4">{[1,2,3].map((i) => <Skeleton key={i} height={28} className="w-full" />)}</div>
            ) : revenue?.plan_mix?.length ? (
              <div className="space-y-4">
                {revenue.plan_mix.map((p) => {
                  const pct = Math.round((p.subs / planTotal) * 100);
                  return (
                    <div key={p.plan_name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <Badge variant="blue">{p.plan_name}</Badge>
                        <span className="text-sm font-semibold mono-num">{money(p.mrr_cents)}<span className="text-xs text-dim font-normal">/mo</span></span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${Math.max(pct, 3)}%` }} />
                      </div>
                      <div className="mt-1 text-[11px] text-dim mono-num">{p.subs} subscribers · {pct}%</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">No active subscriptions yet.</p>
            )}
          </div>
        </Card>

        {/* Recent tenants */}
        <Card padding="none" className="lg:col-span-2">
          <div className="p-6 pb-4">
            <SectionHeader
              title="Latest tenants"
              description="The 5 most recent businesses to join the platform."
              action={<Link href="/admin/tenants" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>}
            />
          </div>
          {loading ? (
            <div className="px-6 pb-6 space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} height={48} />)}</div>
          ) : recentTenants.length === 0 ? (
            <div className="p-6 pt-0"><EmptyState title="No tenants yet" description="When a business signs up, they'll show up here." /></div>
          ) : (
            <table className="w-full text-sm border-t border-gray-100">
              <tbody className="divide-y divide-gray-100">
                {recentTenants.map((t) => (
                  <tr key={t.tenant_id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link href={`/admin/tenants/${t.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.business_name}</Link>
                      <div className="text-xs text-dim">{t.subdomain}.servicehub.app</div>
                    </td>
                    <td className="px-6 py-3.5"><Badge variant="blue">{t.plan_tier}</Badge></td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="text-xs text-muted mono-num">{t.user_count} users · {t.booking_count} bookings</div>
                      <div className="text-[10px] text-dim mt-0.5">{new Date(t.created_at).toLocaleDateString()}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* Activity */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <SectionHeader
            title="Recent activity"
            description="Most recent operator and tenant actions recorded in the audit log."
            action={<Link href="/admin/audit-logs" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>}
          />
        </div>
        {recentAudit.length === 0 ? (
          <div className="p-6 pt-0"><EmptyState title="Nothing here yet" description="Activity will appear once tenants start using the platform." /></div>
        ) : (
          <ul className="border-t border-gray-100 divide-y divide-gray-100">
            {recentAudit.map((a) => (
              <li key={a.id} className="px-6 py-3.5 flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <Badge variant={a.action === 'CREATE' ? 'green' : a.action === 'UPDATE' ? 'blue' : a.action === 'DELETE' ? 'red' : 'gray'}>{a.action}</Badge>
                  <span className="font-medium text-gray-900 truncate">{a.entity_type}</span>
                  <span className="text-muted truncate hidden md:inline">by {a.actor_email || 'system'}</span>
                  <span className="text-dim truncate">on <strong className="text-gray-700">{a.subdomain}</strong></span>
                </div>
                <span className="text-xs text-dim flex-shrink-0 mono-num">{new Date(a.created_at).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminShell>
  );
}

function ChartCard({ title, subtitle, total, data, color, Ico, loading }) {
  return (
    <Card padding="md">
      <div className="flex items-start justify-between mb-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <Skeleton height={32} className="w-20" />
            ) : (
              <>
                <span className="display mono-num !text-[28px]">{total ?? '—'}</span>
                <span className="text-xs text-dim">{subtitle}</span>
              </>
            )}
          </div>
        </div>
        {Ico && (
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 text-gray-600 flex items-center justify-center">
            <Ico className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="mt-3">
        {loading ? <Skeleton height={100} /> : <MiniChart data={data || []} color={color} height={100} showAxis />}
      </div>
    </Card>
  );
}

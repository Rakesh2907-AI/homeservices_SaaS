'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, KpiCard, StatusDot, Skeleton, money,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

import OverviewTab from './tabs/Overview';
import UsersTab from './tabs/Users';
import BookingsTab from './tabs/Bookings';
import RevenueTab from './tabs/Revenue';
import ServicesTab from './tabs/Services';
import CustomersTab from './tabs/Customers';
import ActivityTab from './tabs/Activity';
import SettingsTab from './tabs/Settings';

const TABS = [
  { id: 'overview',  label: 'Overview',  Comp: OverviewTab },
  { id: 'users',     label: 'Users',     Comp: UsersTab },
  { id: 'bookings',  label: 'Bookings',  Comp: BookingsTab },
  { id: 'revenue',   label: 'Revenue',   Comp: RevenueTab },
  { id: 'services',  label: 'Services',  Comp: ServicesTab },
  { id: 'customers', label: 'Customers', Comp: CustomersTab },
  { id: 'activity',  label: 'Activity',  Comp: ActivityTab },
  { id: 'settings',  label: 'Settings',  Comp: SettingsTab },
];

export default function TenantDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('overview');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  function load() {
    adminFetch(`/api/v1/admin/tenants/${id}/summary`)
      .then((r) => { setSummary(r); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(() => { if (id) load(); }, [id]); // eslint-disable-line

  async function toggleActive() {
    if (!summary?.tenant) return;
    try {
      await adminFetch(`/api/v1/admin/tenants/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !summary.tenant.is_active }),
      });
      load();
    } catch (e) { setError(e.message); }
  }

  if (error) {
    return (
      <AdminShell title="Tenant" subtitle="">
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </AdminShell>
    );
  }

  const t = summary?.tenant;
  const counts = summary?.counts || {};
  const sub = summary?.subscription;
  const rev = summary?.revenue || {};
  const ActiveTab = TABS.find((x) => x.id === tab)?.Comp;

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Tenants & Users"
          title={loading ? 'Loading…' : t?.business_name}
          description={t && (
            <span className="flex items-center gap-2 text-[15px]">
              <Icon.Globe className="h-3.5 w-3.5" /> <code className="font-mono">{t.subdomain}.servicehub.app</code>
              <span className="text-gray-300">·</span>
              <StatusDot color={t.is_active ? 'emerald' : 'gray'} label={t.is_active ? 'Active' : 'Suspended'} />
              <span className="text-gray-300">·</span>
              <Badge variant="blue">{t.plan_tier}</Badge>
            </span>
          )}
          breadcrumbs={[
            { label: 'Admin', href: '/admin' },
            { label: 'Tenants', href: '/admin/tenants' },
            { label: t?.business_name || '…' },
          ]}
          actions={
            <>
              <Button href="/admin/tenants" variant="ghost" size="sm">← Back to list</Button>
              <Button variant="secondary" size="sm">
                <Icon.Mail className="h-3.5 w-3.5" /> Contact owner
              </Button>
              {t?.is_active ? (
                <Button onClick={toggleActive} variant="destructive" size="sm">
                  Suspend tenant
                </Button>
              ) : (
                <Button onClick={toggleActive} variant="accent" size="sm">
                  Reactivate
                </Button>
              )}
            </>
          }
          tabs={TABS.map((x) => ({
            label: x.label,
            href: '#',
            active: tab === x.id,
            onClick: () => setTab(x.id),
          }))}
        />
      }
    >
      {/* HERO with logo + key facts */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            {t?.logo_url ? (
              <img src={t.logo_url} alt="logo" className="h-20 w-20 rounded-xl border bg-white object-contain p-1" />
            ) : (
              <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold">
                {(t?.business_name || '?').slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
            <Fact label="Tenant ID" value={loading ? <Skeleton height={14} width={120} /> : <code className="font-mono text-xs">{t?.tenant_id?.slice(0, 8)}…</code>} />
            <Fact label="Plan" value={loading ? <Skeleton height={14} width={60} /> : <Badge variant="blue">{t?.plan_tier}</Badge>} />
            <Fact label="Joined" value={loading ? <Skeleton height={14} width={80} /> : <span className="mono-num">{t && new Date(t.created_at).toLocaleDateString()}</span>} />
            <Fact label="Last activity" value={loading ? <Skeleton height={14} width={80} /> : (
              <span className="mono-num text-muted">
                {summary?.last_login_at ? new Date(summary.last_login_at).toLocaleDateString() : '—'}
              </span>
            )} />
            <Fact label="Subscription" value={loading ? <Skeleton height={14} width={100} /> : (
              sub ? (
                <span className="flex items-center gap-2">
                  <Badge variant={sub.status === 'active' ? 'green' : sub.status === 'past_due' ? 'amber' : 'gray'}>{sub.status}</Badge>
                  <span className="text-xs text-muted">{sub.billing_cycle}</span>
                </span>
              ) : <span className="text-dim">—</span>
            )} />
            <Fact label="Onboarded" value={loading ? <Skeleton height={14} width={50} /> : (
              t?.onboarding_status?.completed ? <span className="text-emerald-600">✓ Yes</span> : <span className="text-amber-600">Step: {t?.onboarding_status?.current_step || '—'}</span>
            )} />
            <Fact label="Renews" value={loading ? <Skeleton height={14} width={80} /> : (
              sub?.current_period_end ? <span className="mono-num">{new Date(sub.current_period_end).toLocaleDateString()}</span> : <span className="text-dim">—</span>
            )} />
            <Fact label="Custom domain" value={loading ? <Skeleton height={14} width={120} /> : (t?.custom_domain ? <code className="font-mono text-xs">{t.custom_domain}</code> : <span className="text-dim">—</span>)} />
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        <KpiCard label="MRR"             value={money(sub?.mrr_cents)}                accent="emerald" Ico={Icon.Dollar} loading={loading} />
        <KpiCard label="Users"           value={counts.users ?? '—'}                  hint={`${counts.admins ?? 0} admin · ${counts.staff ?? 0} staff`} accent="blue" Ico={Icon.Shield} loading={loading} />
        <KpiCard label="Services"        value={`${counts.active_services ?? '—'} / ${counts.services ?? '—'}`} hint="active / total" accent="violet" Ico={Icon.Bolt} loading={loading} />
        <KpiCard label="Bookings"        value={counts.bookings ?? '—'}               hint={`${counts.completed_bookings ?? 0} completed`} accent="cyan" Ico={Icon.Calendar} loading={loading} />
        <KpiCard label="Customers"       value={counts.customers ?? '—'}              hint="end customers" accent="amber" Ico={Icon.Map} loading={loading} />
        <KpiCard label="Lifetime revenue" value={money(rev.paid_total_cents)}         hint={`${rev.paid_invoice_count ?? 0} invoices`} accent="rose" Ico={Icon.Chart} loading={loading} />
      </div>

      {/* Tab content */}
      {ActiveTab && <ActiveTab tenantId={id} summary={summary} onRefresh={load} />}
    </AdminShell>
  );
}

function Fact({ label, value }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-0.5">{label}</div>
      <div className="truncate">{value}</div>
    </div>
  );
}

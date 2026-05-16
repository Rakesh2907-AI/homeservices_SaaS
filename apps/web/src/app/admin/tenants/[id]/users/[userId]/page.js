'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, KpiCard, StatusDot, Skeleton, money,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

import OverviewTab  from './tabs/Overview';
import BookingsTab  from './tabs/Bookings';
import EarningsTab  from './tabs/Earnings';
import ActivityTab  from './tabs/Activity';
import SettingsTab  from './tabs/Settings';

const TABS = [
  { id: 'overview',  label: 'Overview',  Comp: OverviewTab },
  { id: 'bookings',  label: 'Bookings',  Comp: BookingsTab },
  { id: 'earnings',  label: 'Earnings',  Comp: EarningsTab },
  { id: 'activity',  label: 'Activity',  Comp: ActivityTab },
  { id: 'settings',  label: 'Settings',  Comp: SettingsTab },
];

const ROLE_VARIANT = { super_admin: 'red', business_admin: 'blue', staff: 'green', viewer: 'gray' };

export default function UserDetail() {
  const { id: tenantId, userId } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    adminFetch(`/api/v1/admin/tenants/${tenantId}/users/${userId}`)
      .then((d) => { setData(d); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(() => { if (tenantId && userId) load(); }, [tenantId, userId]); // eslint-disable-line

  if (error) {
    return (
      <AdminShell title="User">
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      </AdminShell>
    );
  }

  const u   = data?.user;
  const bs  = data?.booking_stats;
  const as  = data?.activity_stats;
  const ActiveTab = TABS.find((x) => x.id === tab)?.Comp;
  const initials = (u?.full_name || u?.email || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
  const roleColors = {
    super_admin:    'from-rose-500 to-pink-500',
    business_admin: 'from-blue-500 to-cyan-500',
    staff:          'from-emerald-500 to-teal-500',
    viewer:         'from-gray-500 to-gray-600',
  };

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow={u ? `${u.business_name} · Users` : 'User'}
          title={loading ? 'Loading…' : u?.full_name || u?.email}
          description={u && (
            <span className="flex items-center gap-2 text-[15px]">
              <Icon.Mail className="h-3.5 w-3.5" /> <span className="text-muted">{u.email}</span>
              <span className="text-gray-300">·</span>
              <Badge variant={ROLE_VARIANT[u.role] || 'gray'}>{u.role.replace('_', ' ')}</Badge>
              <span className="text-gray-300">·</span>
              <StatusDot color={u.is_active ? 'emerald' : 'gray'} label={u.is_active ? 'Active' : 'Disabled'} />
            </span>
          )}
          breadcrumbs={[
            { label: 'Admin',   href: '/admin' },
            { label: 'Tenants', href: '/admin/tenants' },
            { label: u?.business_name || '…', href: `/admin/tenants/${tenantId}` },
            { label: 'Users',   href: `/admin/tenants/${tenantId}` },
            { label: u?.full_name || u?.email || '…' },
          ]}
          actions={
            <>
              <Button href={`/admin/tenants/${tenantId}`} variant="ghost" size="sm">← Back to tenant</Button>
              <Button variant="secondary" size="sm"><Icon.Mail className="h-3.5 w-3.5" /> Email user</Button>
              <Button variant="secondary" size="sm"><Icon.Lock className="h-3.5 w-3.5" /> Reset password</Button>
            </>
          }
          tabs={TABS.map((x) => ({ label: x.label, href: '#', active: tab === x.id, onClick: () => setTab(x.id) }))}
        />
      }
    >
      {/* Hero */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className={`flex-shrink-0 h-20 w-20 rounded-xl bg-gradient-to-br ${roleColors[u?.role] || roleColors.viewer} flex items-center justify-center text-white text-2xl font-bold`}>
            {loading ? <Skeleton height={40} width={40} className="!bg-white/20" /> : initials}
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-3 text-sm">
            <Fact label="User ID" value={loading ? <Skeleton height={14} width={120} /> : <code className="font-mono text-xs">{u?.id?.slice(0, 8)}…</code>} />
            <Fact label="Role" value={loading ? <Skeleton height={14} width={60} /> : <Badge variant={ROLE_VARIANT[u?.role] || 'gray'}>{u?.role.replace('_', ' ')}</Badge>} />
            <Fact label="Joined" value={loading ? <Skeleton height={14} width={80} /> : <span className="mono-num">{u && new Date(u.created_at).toLocaleDateString()}</span>} />
            <Fact label="Last login" value={loading ? <Skeleton height={14} width={80} /> : (
              <span className="mono-num text-muted">{u?.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</span>
            )} />
            <Fact label="Status" value={loading ? <Skeleton height={14} width={50} /> : <StatusDot color={u?.is_active ? 'emerald' : 'gray'} label={u?.is_active ? 'Active' : 'Disabled'} />} />
            <Fact label="Tenant" value={loading ? <Skeleton height={14} width={100} /> : <span className="text-sm">{u?.business_name}</span>} />
            <Fact label="Email" value={loading ? <Skeleton height={14} width={120} /> : <span className="text-xs">{u?.email}</span>} />
            <Fact label="Total activity" value={loading ? <Skeleton height={14} width={50} /> : <span className="mono-num">{as?.n ?? 0}</span>} />
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
        <KpiCard label="Total bookings" value={bs?.total ?? '—'}     hint="assigned to user"   accent="blue"    Ico={Icon.Calendar} loading={loading} />
        <KpiCard label="Completed"      value={bs?.completed ?? '—'} hint="jobs delivered"     accent="emerald" Ico={Icon.Check}    loading={loading} />
        <KpiCard label="Revenue"        value={`$${Number(bs?.revenue || 0).toFixed(0)}`} hint="completed value" accent="cyan" Ico={Icon.Dollar} loading={loading} />
        <KpiCard label="Estimated earned" value={money(Math.round((data?.earned_estimate || 0) * 100))} hint={data?.commission_rule?.name || 'no commission rule'} accent="violet" Ico={Icon.Chart} loading={loading} />
        <KpiCard label="Actions taken"  value={as?.n ?? 0}           hint="audit-log entries"  accent="amber"   Ico={Icon.Newspaper} loading={loading} />
      </div>

      {ActiveTab && <ActiveTab tenantId={tenantId} userId={userId} data={data} onRefresh={load} />}
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

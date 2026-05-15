'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, StatusDot, EmptyState, FilterBar,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter] = useState('');
  const [plan, setPlan] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/v1/admin/tenants?limit=200')
      .then((r) => { setTenants(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const filtered = useMemo(() => tenants.filter((t) => {
    if (plan !== 'all' && t.plan_tier !== plan) return false;
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return t.business_name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q);
  }), [tenants, filter, plan]);

  async function toggleActive(t) {
    try {
      await adminFetch(`/api/v1/admin/tenants/${t.tenant_id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !t.is_active }) });
      setTenants((prev) => prev.map((x) => x.tenant_id === t.tenant_id ? { ...x, is_active: !t.is_active } : x));
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Tenants & Users"
          title="Tenants"
          description="Every business on the platform — search, filter by plan, and manage their account state."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Tenants' }]}
          actions={
            <>
              <Button variant="secondary" size="sm"><Icon.Newspaper className="h-3.5 w-3.5" /> Export CSV</Button>
              <Button variant="primary" size="sm"><Icon.Globe className="h-3.5 w-3.5" /> Invite tenant</Button>
            </>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Filter row */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search" value={filter} onChange={(e) => setFilter(e.target.value)}
              placeholder="Search business name or subdomain"
              className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <FilterBar
            value={plan}
            onChange={setPlan}
            options={[
              { value: 'all',        label: 'All plans' },
              { value: 'basic',      label: 'Basic' },
              { value: 'pro',        label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ]}
          />
        </div>
        <span className="text-xs text-muted mono-num">{filtered.length} of {tenants.length}</span>
      </div>

      {loading ? (
        <Table>
          <THead><TH>Business</TH><TH>Plan</TH><TH align="right">Users</TH><TH align="right">Bookings</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3,4,5,6].map((i) => (
            <TR key={i} hover={false}>
              <TD><Skeleton height={18} className="w-40 mb-1" /><Skeleton height={11} className="w-24" /></TD>
              <TD><Skeleton height={18} className="w-14" /></TD>
              <TD align="right"><Skeleton height={14} className="w-10 ml-auto" /></TD>
              <TD align="right"><Skeleton height={14} className="w-10 ml-auto" /></TD>
              <TD><Skeleton height={14} className="w-16" /></TD>
              <TD />
            </TR>
          ))}</TBody>
        </Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.Globe} title="No tenants match this filter" description="Try changing the search query or plan filter, or invite a new business to the platform." />
      ) : (
        <Table>
          <THead>
            <TH>Business</TH>
            <TH>Plan</TH>
            <TH align="right">Users</TH>
            <TH align="right">Bookings</TH>
            <TH>Created</TH>
            <TH>Status</TH>
            <TH />
          </THead>
          <TBody>
            {filtered.map((t) => (
              <TR key={t.tenant_id}>
                <TD>
                  <Link href={`/admin/tenants/${t.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.business_name}</Link>
                  <div className="text-xs text-dim flex items-center gap-1 mt-0.5">
                    <Icon.Globe className="h-3 w-3" /> {t.subdomain}.servicehub.app
                    {t.onboarded === 'true' && <span className="ml-1 text-emerald-600 text-[10px] font-medium">✓ onboarded</span>}
                  </div>
                </TD>
                <TD><Badge variant="blue">{t.plan_tier}</Badge></TD>
                <TD align="right" className="mono-num text-gray-700">{t.user_count}</TD>
                <TD align="right" className="mono-num text-gray-700">{t.booking_count}</TD>
                <TD className="text-xs text-dim mono-num">{new Date(t.created_at).toLocaleDateString()}</TD>
                <TD><StatusDot color={t.is_active ? 'emerald' : 'gray'} label={t.is_active ? 'Active' : 'Suspended'} /></TD>
                <TD align="right">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <Link href={`/admin/tenants/${t.tenant_id}`} className="text-blue-600 hover:underline font-medium">View</Link>
                    <button onClick={() => toggleActive(t)} className="text-gray-500 hover:text-rose-600 transition">
                      {t.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

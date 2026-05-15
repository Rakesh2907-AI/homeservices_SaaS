'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, StatusDot, EmptyState, FilterBar,
  Table, THead, TBody, TR, TH, TD, Skeleton, money,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const STATUS_META = {
  active:   { dot: 'emerald', label: 'Active' },
  trialing: { dot: 'blue',    label: 'Trialing' },
  past_due: { dot: 'amber',   label: 'Past due' },
  canceled: { dot: 'gray',    label: 'Canceled' },
};

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/subscriptions')
      .then((r) => { setItems(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  const filtered = useMemo(() => filter === 'all' ? items : items.filter((s) => s.status === filter), [items, filter]);
  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter((s) => s.status === 'active').length,
    trialing: items.filter((s) => s.status === 'trialing').length,
    past_due: items.filter((s) => s.status === 'past_due').length,
    canceled: items.filter((s) => s.status === 'canceled').length,
  }), [items]);

  async function setStatus(sub, status) {
    if (!confirm(`Set ${sub.business_name}'s subscription to "${status}"?`)) return;
    try { await adminFetch(`/api/v1/admin/subscriptions/${sub.id}`, { method: 'PATCH', body: JSON.stringify({ status }) }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Subscriptions"
          description="Every active subscription, billing cycle, and renewal date across the platform."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Subscriptions' }]}
          tabs={[
            { label: 'Overview',      href: '/admin/revenue' },
            { label: 'Subscriptions', href: '/admin/subscriptions', active: true },
            { label: 'Invoices',      href: '/admin/invoices' },
            { label: 'Tax rates',     href: '/admin/taxes' },
            { label: 'Discounts',     href: '/admin/discounts' },
            { label: 'Plans',         href: '/admin/plans' },
          ]}
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-5">
        <FilterBar
          value={filter}
          onChange={setFilter}
          getCount={(v) => counts[v]}
          options={[
            { value: 'all',      label: 'All' },
            { value: 'active',   label: 'Active' },
            { value: 'trialing', label: 'Trialing' },
            { value: 'past_due', label: 'Past due' },
            { value: 'canceled', label: 'Canceled' },
          ]}
        />
      </div>

      {loading ? (
        <Table>
          <THead><TH>Tenant</TH><TH>Plan</TH><TH align="right">MRR</TH><TH>Status</TH><TH>Period ends</TH><TH /></THead>
          <TBody>{[1,2,3,4,5].map((i) => (
            <TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-full max-w-[120px]" /></TD>)}</TR>
          ))}</TBody>
        </Table>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Icon.Dollar} title="No subscriptions match this filter" description="Try changing the status filter, or wait for tenants to sign up." />
      ) : (
        <Table>
          <THead>
            <TH>Tenant</TH>
            <TH>Plan</TH>
            <TH align="right">MRR</TH>
            <TH>Status</TH>
            <TH>Period ends</TH>
            <TH />
          </THead>
          <TBody>
            {filtered.map((s) => {
              const meta = STATUS_META[s.status] || STATUS_META.active;
              return (
                <TR key={s.id}>
                  <TD>
                    <Link href={`/admin/tenants/${s.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{s.business_name}</Link>
                    <div className="text-xs text-dim">{s.subdomain}.servicehub.app</div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2">
                      <Badge variant="blue">{s.plan_name}</Badge>
                      <span className="text-xs text-dim">{s.billing_cycle}</span>
                    </div>
                  </TD>
                  <TD align="right" className="mono-num font-semibold">{money(s.mrr_cents)}</TD>
                  <TD><StatusDot color={meta.dot} label={meta.label} /></TD>
                  <TD className="text-xs text-muted mono-num">{new Date(s.current_period_end).toLocaleDateString()}</TD>
                  <TD align="right">
                    {s.status !== 'canceled' ? (
                      <button onClick={() => setStatus(s, 'canceled')} className="text-xs text-rose-600 hover:underline font-medium">Cancel</button>
                    ) : (
                      <button onClick={() => setStatus(s, 'active')} className="text-xs text-blue-600 hover:underline font-medium">Reactivate</button>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

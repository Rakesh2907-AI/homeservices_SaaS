'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Badge, EmptyState, money, StatusDot } from '@/components/admin/ui';
import { adminFetch } from '@/lib/admin-api';

const STATUS_VARIANT = {
  active:    { variant: 'green',  dot: 'emerald', label: 'Active' },
  trialing:  { variant: 'blue',   dot: 'blue',    label: 'Trialing' },
  past_due:  { variant: 'amber',  dot: 'amber',   label: 'Past due' },
  canceled:  { variant: 'gray',   dot: 'gray',    label: 'Canceled' },
};

export default function SubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/subscriptions').then((r) => setItems(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const filtered = useMemo(() =>
    filter === 'all' ? items : items.filter((s) => s.status === filter),
  [items, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    active: items.filter((s) => s.status === 'active').length,
    trialing: items.filter((s) => s.status === 'trialing').length,
    past_due: items.filter((s) => s.status === 'past_due').length,
    canceled: items.filter((s) => s.status === 'canceled').length,
  }), [items]);

  async function setStatus(sub, status) {
    if (!confirm(`Set ${sub.business_name}'s subscription to "${status}"?`)) return;
    try {
      await adminFetch(`/api/v1/admin/subscriptions/${sub.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      load();
    } catch (e) { setError(e.message); }
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
            { label: `All`,        href: '#all',       active: filter === 'all',      count: counts.all },
            { label: 'Active',     href: '#active',    active: filter === 'active',   count: counts.active },
            { label: 'Trialing',   href: '#trialing',  active: filter === 'trialing', count: counts.trialing },
            { label: 'Past due',   href: '#past_due',  active: filter === 'past_due', count: counts.past_due },
            { label: 'Canceled',   href: '#canceled',  active: filter === 'canceled', count: counts.canceled },
          ].map((t) => ({ ...t, href: '#', onClick: () => {} }))}
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Custom filter bar since PageHeader tabs use links — keep both for visual cohesion */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'active', 'trialing', 'past_due', 'canceled'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')} <span className="opacity-60">· {counts[s]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No subscriptions match this filter" description="Try a different status filter or wait for tenants to sign up." />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3 text-right">MRR</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Period ends</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((s) => {
                const meta = STATUS_VARIANT[s.status] || STATUS_VARIANT.active;
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <Link href={`/admin/tenants/${s.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{s.business_name}</Link>
                      <div className="text-xs text-gray-500">{s.subdomain}.servicehub.app</div>
                    </td>
                    <td className="px-6 py-3"><Badge variant="blue">{s.plan_name}</Badge> <span className="text-xs text-gray-500 ml-2">{s.billing_cycle}</span></td>
                    <td className="px-6 py-3 text-right font-mono font-semibold">{money(s.mrr_cents)}</td>
                    <td className="px-6 py-3"><StatusDot color={meta.dot} label={meta.label} /></td>
                    <td className="px-6 py-3 text-xs text-gray-600">{new Date(s.current_period_end).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-right space-x-3">
                      {s.status !== 'canceled' && <button onClick={() => setStatus(s, 'canceled')} className="text-xs text-rose-600 hover:underline">Cancel</button>}
                      {s.status === 'canceled' && <button onClick={() => setStatus(s, 'active')} className="text-xs text-blue-600 hover:underline">Reactivate</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

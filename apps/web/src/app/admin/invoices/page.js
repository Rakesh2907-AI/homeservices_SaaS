'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Badge, EmptyState, money, KpiCard } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const STATUS_META = {
  draft:    { variant: 'gray',  label: 'Draft' },
  sent:     { variant: 'blue',  label: 'Sent' },
  paid:     { variant: 'green', label: 'Paid' },
  overdue:  { variant: 'amber', label: 'Overdue' },
  void:     { variant: 'gray',  label: 'Void' },
  refunded: { variant: 'red',   label: 'Refunded' },
};

export default function InvoicesPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  function load() {
    const q = filter === 'all' ? '' : `?status=${filter}`;
    adminFetch(`/api/v1/admin/invoices${q}`).then((r) => setItems(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, [filter]); // eslint-disable-line

  const totals = useMemo(() => ({
    paid:    items.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_cents, 0),
    sent:    items.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total_cents, 0),
    overdue: items.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total_cents, 0),
  }), [items]);

  async function markPaid(id) {
    try {
      await adminFetch(`/api/v1/admin/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Invoices"
          description="Every issued invoice across all tenants. Filter by status, mark paid, or open the underlying subscription."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Invoices' }]}
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <KpiCard label="Paid this view"  value={money(totals.paid)}    gradient="from-emerald-500 to-teal-500" Ico={Icon.Check} />
        <KpiCard label="Awaiting payment" value={money(totals.sent)}    gradient="from-blue-500 to-cyan-500"    Ico={Icon.Mail} />
        <KpiCard label="Overdue"          value={money(totals.overdue)} gradient="from-rose-500 to-pink-500"    Ico={Icon.Bolt} />
      </div>

      <div className="mb-4 flex gap-2 flex-wrap">
        {['all', 'sent', 'paid', 'overdue', 'void', 'refunded'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${filter === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState title="No invoices in this view" description="Invoices appear here after a subscription period closes or when manually issued." />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3">Invoice</th>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Issued</th>
                <th className="px-6 py-3">Due</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((i) => {
                const meta = STATUS_META[i.status] || STATUS_META.draft;
                return (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-mono text-xs font-semibold">{i.invoice_number}</td>
                    <td className="px-6 py-3">
                      <Link href={`/admin/tenants/${i.tenant_id}`} className="hover:text-blue-600">{i.business_name}</Link>
                      <div className="text-xs text-gray-500">{i.subdomain}</div>
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">{new Date(i.issued_at).toLocaleDateString()}</td>
                    <td className="px-6 py-3 text-xs text-gray-600">{i.due_at ? new Date(i.due_at).toLocaleDateString() : '—'}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="font-mono font-semibold">{money(i.total_cents)}</div>
                      {i.tax_cents > 0 && <div className="text-[10px] text-gray-500">+{money(i.tax_cents)} tax</div>}
                    </td>
                    <td className="px-6 py-3"><Badge variant={meta.variant}>{meta.label}</Badge></td>
                    <td className="px-6 py-3 text-right">
                      {i.status !== 'paid' && i.status !== 'void' && (
                        <button onClick={() => markPaid(i.id)} className="text-xs text-emerald-600 hover:underline">Mark paid</button>
                      )}
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

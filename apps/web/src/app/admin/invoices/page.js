'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, KpiCard, EmptyState, FilterBar,
  Table, THead, TBody, TR, TH, TD, Skeleton, money,
} from '@/components/admin/ui';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function load() {
    setLoading(true);
    const q = filter === 'all' ? '' : `?status=${filter}`;
    adminFetch(`/api/v1/admin/invoices${q}`)
      .then((r) => { setItems(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, [filter]); // eslint-disable-line

  const totals = useMemo(() => ({
    paid:    items.filter((i) => i.status === 'paid').reduce((s, i) => s + i.total_cents, 0),
    sent:    items.filter((i) => i.status === 'sent').reduce((s, i) => s + i.total_cents, 0),
    overdue: items.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.total_cents, 0),
  }), [items]);

  async function markPaid(id) {
    try { await adminFetch(`/api/v1/admin/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Invoices"
          description="Every issued invoice across all tenants. Filter by status, mark paid, or open the underlying subscription."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Invoices' }]}
          tabs={[
            { label: 'Overview',      href: '/admin/revenue' },
            { label: 'Subscriptions', href: '/admin/subscriptions' },
            { label: 'Invoices',      href: '/admin/invoices', active: true },
            { label: 'Tax rates',     href: '/admin/taxes' },
            { label: 'Discounts',     href: '/admin/discounts' },
            { label: 'Plans',         href: '/admin/plans' },
          ]}
          actions={<Button variant="secondary" size="sm"><Icon.Newspaper className="h-3.5 w-3.5" /> Export CSV</Button>}
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <KpiCard label="Paid this view"   value={money(totals.paid)}    accent="emerald" Ico={Icon.Check}   loading={loading} />
        <KpiCard label="Awaiting payment" value={money(totals.sent)}    accent="blue"    Ico={Icon.Mail}    loading={loading} />
        <KpiCard label="Overdue"          value={money(totals.overdue)} accent="rose"    Ico={Icon.Bolt}    loading={loading} />
      </div>

      <div className="mb-4">
        <FilterBar
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'all',      label: 'All' },
            { value: 'sent',     label: 'Sent' },
            { value: 'paid',     label: 'Paid' },
            { value: 'overdue',  label: 'Overdue' },
            { value: 'void',     label: 'Void' },
            { value: 'refunded', label: 'Refunded' },
          ]}
        />
      </div>

      {loading ? (
        <Table>
          <THead><TH>Invoice</TH><TH>Tenant</TH><TH>Issued</TH><TH>Due</TH><TH align="right">Total</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3,4,5,6].map((i) => (
            <TR key={i} hover={false}>
              {[1,2,3,4,5,6,7].map((c) => <TD key={c}><Skeleton height={14} className="w-full max-w-[100px]" /></TD>)}
            </TR>
          ))}</TBody>
        </Table>
      ) : items.length === 0 ? (
        <EmptyState icon={Icon.Newspaper} title="No invoices in this view" description="Invoices appear here after a subscription period closes or when manually issued." />
      ) : (
        <Table>
          <THead>
            <TH>Invoice</TH>
            <TH>Tenant</TH>
            <TH>Issued</TH>
            <TH>Due</TH>
            <TH align="right">Total</TH>
            <TH>Status</TH>
            <TH />
          </THead>
          <TBody>
            {items.map((i) => {
              const meta = STATUS_META[i.status] || STATUS_META.draft;
              return (
                <TR key={i.id}>
                  <TD><code className="font-mono text-xs font-semibold text-gray-900">{i.invoice_number}</code></TD>
                  <TD>
                    <Link href={`/admin/tenants/${i.tenant_id}`} className="font-medium hover:text-blue-600">{i.business_name}</Link>
                    <div className="text-xs text-dim">{i.subdomain}</div>
                  </TD>
                  <TD className="text-xs text-muted mono-num">{new Date(i.issued_at).toLocaleDateString()}</TD>
                  <TD className="text-xs text-muted mono-num">{i.due_at ? new Date(i.due_at).toLocaleDateString() : '—'}</TD>
                  <TD align="right">
                    <div className="mono-num font-semibold">{money(i.total_cents)}</div>
                    {i.tax_cents > 0 && <div className="text-[10px] text-dim mono-num">+{money(i.tax_cents)} tax</div>}
                  </TD>
                  <TD><Badge variant={meta.variant}>{meta.label}</Badge></TD>
                  <TD align="right">
                    {i.status !== 'paid' && i.status !== 'void' && (
                      <button onClick={() => markPaid(i.id)} className="text-xs text-emerald-600 hover:underline font-medium">Mark paid</button>
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

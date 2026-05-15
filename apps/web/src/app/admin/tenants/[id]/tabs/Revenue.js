'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, KpiCard, Badge, EmptyState, Table, THead, TBody, TR, TH, TD, Skeleton, money } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const INV_STATUS = {
  draft: 'gray', sent: 'blue', paid: 'green', overdue: 'amber', void: 'gray', refunded: 'red',
};

export default function RevenueTab({ tenantId, onRefresh }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  function load() {
    setLoading(true);
    adminFetch(`/api/v1/admin/tenants/${tenantId}/revenue`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }
  useEffect(() => { if (tenantId) load(); }, [tenantId]); // eslint-disable-line

  async function markPaid(id) {
    setBusy(id);
    try {
      await adminFetch(`/api/v1/admin/invoices/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'paid' }) });
      load();
      onRefresh?.();
    } finally { setBusy(null); }
  }

  const t = data?.totals;
  const sub = data?.subscription;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Paid"         value={money(t?.paid_cents)}        hint={`${t?.paid_count ?? 0} invoices`}      accent="emerald" Ico={Icon.Check}     loading={loading} />
        <KpiCard label="Outstanding"  value={money(t?.outstanding_cents)} hint={`${t?.outstanding_count ?? 0} unpaid`}  accent="amber"   Ico={Icon.Newspaper} loading={loading} />
        <KpiCard label="Refunded"     value={money(t?.refunded_cents)}    hint="lifetime refunds"                       accent="rose"    Ico={Icon.Bolt}      loading={loading} />
        <KpiCard label="Tax collected" value={money(t?.tax_collected_cents)} hint="on paid invoices"                    accent="violet"  Ico={Icon.Layers}    loading={loading} />
      </div>

      {/* Subscription card */}
      <Card className="mb-6">
        <CardHeader title="Subscription" description="Current billing plan and renewal date." />
        {sub ? (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-4">
            <Detail label="Plan"><Badge variant="blue">{sub.plan_name}</Badge></Detail>
            <Detail label="Status"><Badge variant={sub.status === 'active' ? 'green' : sub.status === 'past_due' ? 'amber' : 'gray'}>{sub.status}</Badge></Detail>
            <Detail label="MRR"><span className="mono-num font-semibold">{money(sub.mrr_cents)}</span></Detail>
            <Detail label="Billing"><span className="text-muted text-sm">{sub.billing_cycle}</span></Detail>
            <Detail label="Renews"><span className="mono-num text-sm">{new Date(sub.current_period_end).toLocaleDateString()}</span></Detail>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No subscription on record.</p>
        )}
      </Card>

      {/* Invoices */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <CardHeader title="Invoices" description="The 50 most recent invoices for this tenant." />
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} height={42} />)}</div>
        ) : !data?.invoices?.length ? (
          <div className="p-6 pt-0">
            <EmptyState icon={Icon.Newspaper} title="No invoices yet" description="The tenant doesn't have any invoices in our system." />
          </div>
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <THead>
              <TH>Invoice</TH>
              <TH>Issued</TH>
              <TH>Due</TH>
              <TH>Paid</TH>
              <TH align="right">Subtotal</TH>
              <TH align="right">Tax</TH>
              <TH align="right">Total</TH>
              <TH>Status</TH>
              <TH />
            </THead>
            <TBody>
              {data.invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD><code className="font-mono text-xs font-semibold">{inv.invoice_number}</code></TD>
                  <TD className="text-xs text-muted mono-num">{new Date(inv.issued_at).toLocaleDateString()}</TD>
                  <TD className="text-xs text-muted mono-num">{inv.due_at ? new Date(inv.due_at).toLocaleDateString() : '—'}</TD>
                  <TD className="text-xs text-dim mono-num">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}</TD>
                  <TD align="right" className="mono-num">{money(inv.subtotal_cents)}</TD>
                  <TD align="right" className="mono-num text-dim">{money(inv.tax_cents)}</TD>
                  <TD align="right" className="mono-num font-semibold">{money(inv.total_cents)}</TD>
                  <TD><Badge variant={INV_STATUS[inv.status] || 'gray'}>{inv.status}</Badge></TD>
                  <TD align="right">
                    {inv.status !== 'paid' && inv.status !== 'void' && (
                      <button onClick={() => markPaid(inv.id)} disabled={busy === inv.id} className="text-xs text-emerald-600 hover:underline font-medium disabled:opacity-50">
                        {busy === inv.id ? '…' : 'Mark paid'}
                      </button>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}

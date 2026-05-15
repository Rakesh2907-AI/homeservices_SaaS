'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import MiniChart from '@/components/admin/MiniChart';
import {
  Button, Card, CardHeader, KpiCard, SectionHeader, EmptyState, Badge,
  Table, THead, TBody, TR, TH, TD, Skeleton, money,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function RevenuePage() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/v1/admin/revenue/summary'),
      adminFetch('/api/v1/admin/revenue/timeseries?months=6'),
    ]).then(([s, t]) => { setSummary(s); setTimeseries(t.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const billedSeries  = timeseries.map((m) => ({ day: m.month, n: Math.round(m.billed_cents / 100) }));
  const pendingSeries = timeseries.map((m) => ({ day: m.month, n: Math.round(m.pending_cents / 100) }));
  const totalBilled  = timeseries.reduce((s, m) => s + m.billed_cents, 0);
  const totalPending = timeseries.reduce((s, m) => s + m.pending_cents, 0);

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Revenue"
          description="Recurring revenue, billings, churn, and the financial health of every plan tier."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue' }]}
          tabs={[
            { label: 'Overview',      href: '/admin/revenue',       active: true },
            { label: 'Subscriptions', href: '/admin/subscriptions' },
            { label: 'Invoices',      href: '/admin/invoices' },
            { label: 'Tax rates',     href: '/admin/taxes' },
            { label: 'Discounts',     href: '/admin/discounts' },
            { label: 'Plans',         href: '/admin/plans' },
          ]}
        />
      }
    >
      {error && <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monthly recurring revenue" value={money(summary?.mrr_cents)}        hint="MRR · all active subs" accent="emerald" Ico={Icon.Dollar} loading={loading} />
        <KpiCard label="Annual run rate"            value={money(summary?.arr_cents)}        hint="MRR × 12"               accent="blue"    Ico={Icon.Chart}  loading={loading} />
        <KpiCard label="Average revenue per user"   value={money(summary?.arpu_cents)}       hint="ARPU"                   accent="violet"  Ico={Icon.Shield} loading={loading} />
        <KpiCard label="Outstanding"                value={money(summary?.outstanding_cents)} hint={`${summary?.outstanding_count || 0} invoices unpaid`} accent="amber" Ico={Icon.Newspaper} loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        <Card>
          <CardHeader title="Billed" description="Successfully paid invoices, monthly." />
          <div className="display mono-num !text-2xl mt-3 mb-4">{money(totalBilled)}</div>
          {loading ? <Skeleton height={120} /> : <MiniChart data={billedSeries} color="#10b981" height={120} showAxis />}
        </Card>
        <Card>
          <CardHeader title="Pending collection" description="Invoices issued but not yet paid." />
          <div className="display mono-num !text-2xl mt-3 mb-4">{money(totalPending)}</div>
          {loading ? <Skeleton height={120} /> : <MiniChart data={pendingSeries} color="#f59e0b" height={120} showAxis />}
        </Card>
      </div>

      <Card padding="none" className="mb-8">
        <div className="p-6 pb-4">
          <SectionHeader
            title="Plan performance"
            description="MRR contribution and subscriber count per plan tier."
            action={<Button href="/admin/plans" variant="ghost" size="sm">Manage plans →</Button>}
          />
        </div>
        {summary?.plan_mix?.length ? (
          <Table className="border-0 rounded-none shadow-none">
            <THead>
              <TH>Plan</TH>
              <TH align="right">Subscribers</TH>
              <TH align="right">MRR</TH>
              <TH align="right">ARPU</TH>
              <TH align="right">Share</TH>
            </THead>
            <TBody>
              {summary.plan_mix.map((p) => {
                const arpu  = p.subs ? Math.round(p.mrr_cents / p.subs) : 0;
                const share = Math.round((p.mrr_cents / (summary.mrr_cents || 1)) * 100);
                return (
                  <TR key={p.plan_name}>
                    <TD><Badge variant="blue">{p.plan_name}</Badge></TD>
                    <TD align="right" className="mono-num font-medium">{p.subs}</TD>
                    <TD align="right" className="mono-num font-semibold text-gray-900">{money(p.mrr_cents)}</TD>
                    <TD align="right" className="mono-num text-muted">{money(arpu)}</TD>
                    <TD align="right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <span className="text-xs text-muted w-10 text-right mono-num">{share}%</span>
                        <div className="h-1.5 rounded-full bg-gray-100 w-24 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <div className="p-6 pt-0"><EmptyState title="No subscriptions yet" description="Once tenants subscribe, their plan contribution will appear here." /></div>
        )}
      </Card>
    </AdminShell>
  );
}

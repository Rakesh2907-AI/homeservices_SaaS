'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import MiniChart from '@/components/admin/MiniChart';
import { KpiCard, SectionHeader, EmptyState, Badge, money } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function RevenuePage() {
  const [summary, setSummary] = useState(null);
  const [timeseries, setTimeseries] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      adminFetch('/api/v1/admin/revenue/summary'),
      adminFetch('/api/v1/admin/revenue/timeseries?months=6'),
    ]).then(([s, t]) => { setSummary(s); setTimeseries(t.data); }).catch((e) => setError(e.message));
  }, []);

  // MiniChart wants { day, n } — transform billings per month into that shape.
  const billedSeries = timeseries.map((m) => ({ day: m.month, n: Math.round(m.billed_cents / 100) }));
  const pendingSeries = timeseries.map((m) => ({ day: m.month, n: Math.round(m.pending_cents / 100) }));

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
      {error && <div className="mb-6 rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Monthly recurring revenue" value={money(summary?.mrr_cents)}    hint="MRR · all active subs" gradient="from-emerald-500 to-teal-500" Ico={Icon.Dollar} />
        <KpiCard label="Annual run rate"           value={money(summary?.arr_cents)}    hint="MRR × 12"               gradient="from-blue-500 to-cyan-500"    Ico={Icon.Chart} />
        <KpiCard label="ARPU"                       value={money(summary?.arpu_cents)}   hint="avg revenue per user"   gradient="from-violet-500 to-purple-500" Ico={Icon.Shield} />
        <KpiCard label="Outstanding"               value={money(summary?.outstanding_cents)} hint={`${summary?.outstanding_count || 0} invoices`} gradient="from-amber-500 to-orange-500" Ico={Icon.Newspaper} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <SectionHeader title="Billed" description="Successfully paid invoices, monthly." />
          <div className="text-3xl font-bold mb-3">{money(timeseries.reduce((s, m) => s + m.billed_cents, 0))}</div>
          <MiniChart data={billedSeries} color="#10b981" height={120} showAxis />
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <SectionHeader title="Pending collection" description="Invoices issued but not yet paid." />
          <div className="text-3xl font-bold mb-3">{money(timeseries.reduce((s, m) => s + m.pending_cents, 0))}</div>
          <MiniChart data={pendingSeries} color="#f59e0b" height={120} showAxis />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8">
        <SectionHeader title="Plan performance" description="MRR contribution and subscriber count per plan tier." />
        {summary?.plan_mix?.length ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="py-2">Plan</th>
                <th className="py-2 text-right">Subscribers</th>
                <th className="py-2 text-right">MRR</th>
                <th className="py-2 text-right">ARPU</th>
                <th className="py-2 text-right">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summary.plan_mix.map((p) => {
                const arpu = p.subs ? Math.round(p.mrr_cents / p.subs) : 0;
                const share = Math.round((p.mrr_cents / (summary.mrr_cents || 1)) * 100);
                return (
                  <tr key={p.plan_name}>
                    <td className="py-3"><Badge variant="blue">{p.plan_name}</Badge></td>
                    <td className="py-3 text-right font-mono">{p.subs}</td>
                    <td className="py-3 text-right font-mono font-semibold">{money(p.mrr_cents)}</td>
                    <td className="py-3 text-right font-mono">{money(arpu)}</td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-2">
                        <span className="text-xs text-gray-600 w-10 text-right">{share}%</span>
                        <div className="h-1.5 rounded-full bg-gray-100 w-24 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-500" style={{ width: `${share}%` }} />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <EmptyState title="No subscriptions yet" description="Once tenants sign up, their plan contribution will appear here." />
        )}
      </div>
    </AdminShell>
  );
}

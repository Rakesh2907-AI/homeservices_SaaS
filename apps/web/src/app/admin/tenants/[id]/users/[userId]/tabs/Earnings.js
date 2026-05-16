'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, KpiCard, EmptyState, Badge, Table, THead, TBody, TR, TH, TD, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import MiniChart from '@/components/admin/MiniChart';
import { adminFetch } from '@/lib/admin-api';

/**
 * Earnings tab — shows commission breakdown for this user. Pulls completed
 * bookings, applies the active staff-commission rule, and displays:
 *   - 4 KPI tiles (jobs, total earned, customer spend, avg per job)
 *   - Monthly earnings chart
 *   - Applied rule card
 *   - Per-booking earnings table
 */
export default function EarningsTab({ tenantId, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !userId) return;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/users/${userId}/earnings`)
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId, userId]);

  const t = data?.totals || {};
  const rule = data?.rule;
  const chartSeries = (data?.by_month || []).map((m) => ({ day: m.month, n: Math.round(m.total) }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Jobs completed"  value={t.jobs_completed ?? '—'}        hint="paid out"          accent="emerald" Ico={Icon.Check}  loading={loading} />
        <KpiCard label="Total earned"    value={`$${(t.total_earned || 0).toFixed(2)}`} hint="commission earnings" accent="violet"  Ico={Icon.Dollar} loading={loading} />
        <KpiCard label="Customer spend"  value={`$${(t.customer_spend || 0).toFixed(2)}`} hint="gross revenue generated" accent="cyan"   Ico={Icon.Chart} loading={loading} />
        <KpiCard label="Avg per job"     value={`$${(t.avg_per_job || 0).toFixed(2)}`} hint="mean earnings"     accent="blue"    Ico={Icon.Bolt}   loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Monthly earnings" description="Commission earned per calendar month." />
          {loading ? <Skeleton height={140} className="mt-4" /> : chartSeries.length === 0 ? (
            <div className="mt-4 text-sm text-muted italic">No earnings recorded yet.</div>
          ) : (
            <div className="mt-4">
              <MiniChart data={chartSeries} color="#7c3aed" height={140} showAxis />
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Commission rule" description="Active rule being applied to this user's completed bookings." />
          {loading ? (
            <div className="mt-4 space-y-2"><Skeleton height={14} /><Skeleton height={14} className="w-3/4" /></div>
          ) : rule ? (
            <div className="mt-4 space-y-3 text-sm">
              <Row label="Name"><span className="font-medium">{rule.name}</span></Row>
              <Row label="Type"><Badge variant="violet">{rule.applies_to}</Badge></Row>
              <Row label="Rate">
                <span className="mono-num font-semibold">
                  {rule.rate_type === 'percent' ? `${parseFloat(rule.rate_value).toFixed(1)}%` : `$${parseFloat(rule.rate_value).toFixed(2)}`}
                </span>
              </Row>
              {rule.min_amount && <Row label="Min"><span className="mono-num">${parseFloat(rule.min_amount).toFixed(2)}</span></Row>}
              {rule.max_amount && <Row label="Max"><span className="mono-num">${parseFloat(rule.max_amount).toFixed(2)}</span></Row>}
            </div>
          ) : (
            <div className="mt-4 text-sm text-muted italic">
              No active staff commission rule. Configure one in the tenant&apos;s Services tab.
            </div>
          )}
        </Card>
      </div>

      <Card padding="none">
        <div className="p-6 pb-4">
          <CardHeader title="Per-job earnings" description="Each completed booking with the calculated commission amount." />
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} height={42} />)}</div>
        ) : !data?.earnings?.length ? (
          <div className="p-6 pt-0">
            <EmptyState
              icon={Icon.Dollar}
              title="No completed jobs yet"
              description="Once this user completes bookings, the per-job commission breakdown will appear here."
            />
          </div>
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <THead>
              <TH>Date</TH>
              <TH>Service</TH>
              <TH>Customer</TH>
              <TH align="right">Customer paid</TH>
              <TH align="right">User earned</TH>
            </THead>
            <TBody>
              {data.earnings.map((e) => (
                <TR key={e.id}>
                  <TD className="text-xs text-muted mono-num">{new Date(e.scheduled_at).toLocaleDateString()}</TD>
                  <TD className="font-medium">{e.service_title || '—'}</TD>
                  <TD>{e.customer_name || <span className="text-dim">—</span>}</TD>
                  <TD align="right" className="mono-num">${parseFloat(e.quoted_price || 0).toFixed(2)}</TD>
                  <TD align="right" className="mono-num font-semibold text-emerald-700">${e.earned.toFixed(2)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

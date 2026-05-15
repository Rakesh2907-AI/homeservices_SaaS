'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, SectionHeader, EmptyState, Badge, Skeleton, money } from '@/components/admin/ui';
import MiniChart from '@/components/admin/MiniChart';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

/**
 * The Overview tab — pulls a timeline chart, recent activity, recent bookings,
 * and the staff/admin breakdown into one digestible view.
 */
export default function OverviewTab({ tenantId, summary }) {
  const [timeline, setTimeline] = useState([]);
  const [activity, setActivity] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      adminFetch(`/api/v1/admin/tenants/${tenantId}/timeline?days=30`),
      adminFetch(`/api/v1/admin/tenants/${tenantId}/activity?limit=8`),
      adminFetch(`/api/v1/admin/tenants/${tenantId}/bookings?limit=5`),
    ]).then(([t, a, b]) => {
      setTimeline(t.data); setActivity(a.data); setBookings(b.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [tenantId]);

  const totalBookings = timeline.reduce((s, d) => s + d.bookings, 0);
  const totalRevenue = timeline.reduce((s, d) => s + Number(d.revenue || 0), 0);
  const bookingSeries = timeline.map((d) => ({ day: d.day, n: d.bookings }));
  const revenueSeries = timeline.map((d) => ({ day: d.day, n: Math.round(Number(d.revenue) || 0) }));

  return (
    <div className="space-y-6">
      {/* Top-line health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Bookings — last 30 days" description={`${totalBookings} bookings`} />
          <div className="mt-4">
            {loading ? <Skeleton height={100} /> : <MiniChart data={bookingSeries} color="#2563eb" height={100} showAxis />}
          </div>
        </Card>
        <Card>
          <CardHeader title="Booking value — last 30 days" description={`$${totalRevenue.toFixed(2)} quoted`} />
          <div className="mt-4">
            {loading ? <Skeleton height={100} /> : <MiniChart data={revenueSeries} color="#10b981" height={100} showAxis />}
          </div>
        </Card>
      </div>

      {/* Two-column: recent bookings + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card padding="none">
          <div className="p-6 pb-3">
            <SectionHeader title="Recent bookings" description="Last 5 bookings, newest first." />
          </div>
          {loading ? (
            <div className="p-6 pt-0 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} height={42} />)}</div>
          ) : bookings.length === 0 ? (
            <div className="p-6 pt-0"><EmptyState icon={Icon.Calendar} title="No bookings yet" description="The tenant hasn't taken any bookings yet." /></div>
          ) : (
            <ul className="border-t border-gray-100 divide-y divide-gray-100">
              {bookings.map((b) => (
                <li key={b.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900 truncate">{b.service_title || 'Service'}</div>
                    <div className="text-xs text-dim">
                      {b.customer_name || 'Anonymous'} · {new Date(b.scheduled_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <div className="text-sm font-semibold mono-num">${parseFloat(b.quoted_price || 0).toFixed(0)}</div>
                    <Badge variant={STATUS_VARIANT[b.status] || 'gray'} size="sm">{b.status}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card padding="none">
          <div className="p-6 pb-3">
            <SectionHeader title="Recent activity" description="Audit-log events for this tenant." />
          </div>
          {loading ? (
            <div className="p-6 pt-0 space-y-3">{[1,2,3].map((i) => <Skeleton key={i} height={42} />)}</div>
          ) : activity.length === 0 ? (
            <div className="p-6 pt-0"><EmptyState icon={Icon.Newspaper} title="No activity yet" description="Audit log entries will appear here." /></div>
          ) : (
            <ul className="border-t border-gray-100 divide-y divide-gray-100">
              {activity.map((a) => (
                <li key={a.id} className="px-6 py-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Badge variant={a.action === 'CREATE' ? 'green' : a.action === 'UPDATE' ? 'blue' : a.action === 'DELETE' ? 'red' : 'gray'}>{a.action}</Badge>
                    <span className="font-medium text-gray-900 truncate">{a.entity_type}</span>
                    <span className="text-xs text-dim truncate">by {a.actor_email || 'system'}</span>
                  </div>
                  <span className="text-xs text-dim mono-num flex-shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick info row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <SectionHeader title="Onboarding" description="Setup wizard progress." />
          <Onboarding status={summary?.tenant?.onboarding_status} />
        </Card>
        <Card>
          <SectionHeader title="Plan" description="Current subscription details." />
          {summary?.subscription ? (
            <div className="space-y-2 text-sm">
              <Row label="Plan"><Badge variant="blue">{summary.subscription.plan_name}</Badge></Row>
              <Row label="Billing"><span className="text-muted">{summary.subscription.billing_cycle}</span></Row>
              <Row label="MRR"><span className="mono-num font-semibold">{money(summary.subscription.mrr_cents)}</span></Row>
              <Row label="Renews"><span className="mono-num text-muted">{new Date(summary.subscription.current_period_end).toLocaleDateString()}</span></Row>
              {summary.subscription.canceled_at && <Row label="Canceled"><span className="text-rose-600 mono-num">{new Date(summary.subscription.canceled_at).toLocaleDateString()}</span></Row>}
            </div>
          ) : <p className="text-sm text-muted">No subscription on file.</p>}
        </Card>
        <Card>
          <SectionHeader title="Branding" description="Theme colors used in the customer portal." />
          {summary?.tenant?.theme_config ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(summary.tenant.theme_config)
                .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
                .map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1">
                    <span className="inline-block h-4 w-4 rounded border" style={{ background: v }} />
                    <code className="text-[10px] font-mono text-muted">{v}</code>
                  </div>
                ))}
              {summary.tenant.theme_config.font_family && (
                <div className="rounded border border-gray-200 px-2 py-1 text-xs text-muted">{summary.tenant.theme_config.font_family.split(',')[0]}</div>
              )}
            </div>
          ) : <p className="text-sm text-muted">No theme configured.</p>}
        </Card>
      </div>
    </div>
  );
}

const STATUS_VARIANT = {
  pending: 'amber', confirmed: 'blue', in_progress: 'violet',
  completed: 'green', cancelled: 'red',
};

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</span>
      <span>{children}</span>
    </div>
  );
}

function Onboarding({ status }) {
  if (!status) return <p className="text-sm text-muted">No onboarding info.</p>;
  const steps = ['theme', 'business', 'categories', 'services', 'commissions', 'complete'];
  const done = new Set(status.steps_done || []);
  return (
    <div className="space-y-1.5 mt-1">
      {steps.map((s) => {
        const isDone = done.has(s);
        const isCurrent = status.current_step === s;
        return (
          <div key={s} className="flex items-center gap-2 text-sm">
            <span className={`h-4 w-4 rounded-full flex items-center justify-center text-[10px] flex-shrink-0 ${
              isDone ? 'bg-emerald-100 text-emerald-700' : isCurrent ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'
            }`}>
              {isDone ? '✓' : isCurrent ? '•' : ''}
            </span>
            <span className={`capitalize ${isDone ? 'text-emerald-700 line-through opacity-70' : isCurrent ? 'font-medium text-gray-900' : 'text-muted'}`}>{s}</span>
          </div>
        );
      })}
    </div>
  );
}

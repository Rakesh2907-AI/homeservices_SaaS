'use client';
import { Card, CardHeader, Badge, money, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';

/**
 * Overview tab — at-a-glance summary of who the user is and what they do.
 * Pulls everything from the already-loaded summary payload (no extra fetch).
 */
export default function OverviewTab({ tenantId, userId, data }) {
  const u   = data?.user;
  const bs  = data?.booking_stats;
  const as  = data?.activity_stats;
  const rule = data?.commission_rule;

  if (!u) return null;

  const completionRate = bs?.total ? Math.round((bs.completed / bs.total) * 100) : 0;
  const cancelRate     = bs?.total ? Math.round((bs.cancelled / bs.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Profile */}
      <Card>
        <CardHeader title="Profile" description="Identity, role, and contact details." />
        <div className="mt-4 space-y-3 text-sm">
          <Row label="Full name">{u.full_name || <span className="text-dim">—</span>}</Row>
          <Row label="Email"><a href={`mailto:${u.email}`} className="text-blue-600 hover:underline">{u.email}</a></Row>
          <Row label="Role"><Badge variant={u.role === 'business_admin' ? 'blue' : u.role === 'staff' ? 'green' : 'gray'}>{u.role.replace('_', ' ')}</Badge></Row>
          <Row label="Status"><StatusDot color={u.is_active ? 'emerald' : 'gray'} label={u.is_active ? 'Active' : 'Disabled'} /></Row>
          <Row label="User ID"><code className="font-mono text-[10px] text-dim">{u.id}</code></Row>
          <div className="pt-3 mt-3 border-t border-gray-100 space-y-3">
            <Row label="Joined"><span className="mono-num">{new Date(u.created_at).toLocaleString()}</span></Row>
            <Row label="Last login">{u.last_login_at ? <span className="mono-num text-muted">{new Date(u.last_login_at).toLocaleString()}</span> : <span className="text-dim italic">Never</span>}</Row>
            <Row label="Last activity">{as?.last_action ? <span className="mono-num text-muted">{new Date(as.last_action).toLocaleString()}</span> : <span className="text-dim italic">No activity</span>}</Row>
          </div>
        </div>
      </Card>

      {/* Bookings summary */}
      <Card>
        <CardHeader title="Booking performance" description="Jobs assigned to this user, broken down by status." />
        <div className="mt-4 space-y-3">
          <BookingStat label="Total assigned" value={bs?.total ?? 0} />
          <BookingStat label="Completed"     value={bs?.completed ?? 0} color="emerald" pct={completionRate} />
          <BookingStat label="Pending"       value={bs?.pending ?? 0} color="amber" />
          <BookingStat label="Cancelled"     value={bs?.cancelled ?? 0} color="rose" pct={cancelRate} />
        </div>
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Completed revenue</span>
            <span className="mono-num font-semibold">${Number(bs?.revenue || 0).toFixed(2)}</span>
          </div>
        </div>
      </Card>

      {/* Earnings preview */}
      <Card>
        <CardHeader title="Estimated earnings" description="Based on the active staff-commission rule applied to completed jobs." />
        {rule ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-md bg-gray-50/70 border border-gray-100 p-3">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">Applied rule</div>
              <div className="font-medium text-sm">{rule.name}</div>
              <div className="text-xs text-muted mt-0.5">
                {rule.rate_type === 'percent'
                  ? `${parseFloat(rule.rate_value).toFixed(1)}% of completed booking revenue`
                  : `$${parseFloat(rule.rate_value).toFixed(2)} flat per completed booking`}
              </div>
            </div>
            <div className="pt-3 border-t border-gray-100">
              <div className="text-[10px] uppercase tracking-wider font-semibold text-muted mb-1">Estimated total</div>
              <div className="display mono-num !text-2xl text-emerald-600">${Number(data.earned_estimate).toFixed(2)}</div>
              <div className="text-xs text-dim mt-1">Across {bs?.completed ?? 0} completed booking{bs?.completed === 1 ? '' : 's'}</div>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-muted italic">
            No active staff-commission rule. Set one in the tenant&apos;s Services tab to start tracking earnings.
          </div>
        )}
      </Card>

      {/* Role-specific note */}
      {u.role === 'business_admin' && (
        <Card className="lg:col-span-3 border-blue-100 bg-blue-50/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-blue-100 text-blue-700 flex items-center justify-center">
              <Icon.Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Business admin</h3>
              <p className="mt-0.5 text-sm text-muted">
                This user has full administrative access to the <strong>{u.business_name}</strong> tenant — they can manage other users, configure services, and view all financial data.
                Audit-log activity reflects their administrative actions, not field work.
              </p>
            </div>
          </div>
        </Card>
      )}
      {u.role === 'staff' && (
        <Card className="lg:col-span-3 border-emerald-100 bg-emerald-50/30">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-8 w-8 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Icon.Bolt className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-900">Service provider</h3>
              <p className="mt-0.5 text-sm text-muted">
                Field technician — gets assigned to bookings and earns commissions based on completed work.
                See the <strong>Earnings</strong> tab for payment history and per-job breakdowns.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">{label}</span>
      <span className="text-right truncate">{children}</span>
    </div>
  );
}

const DOT_COLORS = { gray: 'bg-gray-400', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' };
function BookingStat({ label, value, color = 'gray', pct }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm">
        <span className={`h-2 w-2 rounded-full ${DOT_COLORS[color]}`} />
        <span className="text-muted">{label}</span>
      </span>
      <span className="flex items-baseline gap-2">
        <span className="mono-num font-semibold">{value}</span>
        {pct != null && <span className="text-xs text-dim mono-num">({pct}%)</span>}
      </span>
    </div>
  );
}

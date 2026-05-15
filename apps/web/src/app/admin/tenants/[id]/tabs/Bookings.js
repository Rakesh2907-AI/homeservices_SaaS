'use client';
import { useEffect, useMemo, useState } from 'react';
import { Badge, KpiCard, EmptyState, FilterBar, Table, THead, TBody, TR, TH, TD, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const STATUS_VARIANT = {
  pending:    { variant: 'amber', dot: 'amber' },
  confirmed:  { variant: 'blue',  dot: 'blue' },
  in_progress:{ variant: 'violet',dot: 'violet' },
  completed:  { variant: 'green', dot: 'emerald' },
  cancelled:  { variant: 'red',   dot: 'rose' },
};

export default function BookingsTab({ tenantId }) {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    setLoading(true);
    const q = filter === 'all' ? '' : `?status=${filter}`;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/bookings${q}&limit=200`.replace('?&', '?'))
      .then((r) => { setBookings(r.data); setStats(r.stats); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId, filter]);

  const totalEarned = stats?.earned || 0;
  const totalValue = stats?.total_value || 0;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total bookings"     value={stats?.total ?? '—'}      hint={`${stats?.completed ?? 0} completed`} accent="blue"    Ico={Icon.Calendar} loading={loading} />
        <KpiCard label="Earned"             value={`$${totalEarned.toFixed(0)}`}  hint="from completed bookings"      accent="emerald" Ico={Icon.Dollar}   loading={loading} />
        <KpiCard label="Pipeline value"     value={`$${totalValue.toFixed(0)}`}  hint="all bookings quoted"           accent="cyan"    Ico={Icon.Chart}    loading={loading} />
        <KpiCard label="Cancellation rate"  value={`${stats?.total ? Math.round((stats.cancelled / stats.total) * 100) : 0}%`} hint={`${stats?.cancelled ?? 0} cancelled`} accent="rose" Ico={Icon.Bolt} loading={loading} />
      </div>

      <div className="mb-4">
        <FilterBar
          value={filter}
          onChange={setFilter}
          getCount={(v) => {
            if (!stats) return null;
            if (v === 'all') return stats.total;
            return stats[v];
          }}
          options={[
            { value: 'all',         label: 'All' },
            { value: 'pending',     label: 'Pending' },
            { value: 'confirmed',   label: 'Confirmed' },
            { value: 'in_progress', label: 'In progress' },
            { value: 'completed',   label: 'Completed' },
            { value: 'cancelled',   label: 'Cancelled' },
          ]}
        />
      </div>

      {loading ? (
        <Table>
          <THead><TH>When</TH><TH>Service</TH><TH>Customer</TH><TH>Staff</TH><TH align="right">Price</TH><TH>Status</TH></THead>
          <TBody>{[1,2,3].map((i) => (
            <TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-20" /></TD>)}</TR>
          ))}</TBody>
        </Table>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Icon.Calendar}
          title="No bookings in this filter"
          description="Try changing the status filter, or wait for new bookings to come in."
        />
      ) : (
        <Table>
          <THead>
            <TH>When</TH>
            <TH>Service</TH>
            <TH>Customer</TH>
            <TH>Staff</TH>
            <TH align="right">Price</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {bookings.map((b) => {
              const meta = STATUS_VARIANT[b.status] || { variant: 'gray', dot: 'gray' };
              return (
                <TR key={b.id}>
                  <TD>
                    <div className="font-medium mono-num">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                    <div className="text-xs text-dim mono-num">{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </TD>
                  <TD>
                    <div className="font-medium">{b.service_title || '—'}</div>
                    {b.notes && <div className="text-xs text-dim truncate max-w-[260px]">{b.notes}</div>}
                  </TD>
                  <TD>
                    <div>{b.customer_name || '—'}</div>
                    <div className="text-xs text-dim">{b.customer_email || ''}</div>
                  </TD>
                  <TD>
                    <div className="text-sm">{b.staff_name || <span className="text-dim">Unassigned</span>}</div>
                  </TD>
                  <TD align="right" className="mono-num font-semibold">${parseFloat(b.quoted_price || 0).toFixed(2)}</TD>
                  <TD><Badge variant={meta.variant}>{b.status.replace('_', ' ')}</Badge></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}

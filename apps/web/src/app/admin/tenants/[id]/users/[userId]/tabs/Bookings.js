'use client';
import { useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, FilterBar, Table, THead, TBody, TR, TH, TD, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const STATUS_VARIANT = {
  pending: 'amber', confirmed: 'blue', in_progress: 'violet', completed: 'green', cancelled: 'red',
};

export default function BookingsTab({ tenantId, userId }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId || !userId) return;
    setLoading(true);
    const q = filter === 'all' ? '' : `?status=${filter}`;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/users/${userId}/bookings${q}`)
      .then((r) => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId, userId, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    pending: items.filter((b) => b.status === 'pending').length,
    confirmed: items.filter((b) => b.status === 'confirmed').length,
    in_progress: items.filter((b) => b.status === 'in_progress').length,
    completed: items.filter((b) => b.status === 'completed').length,
    cancelled: items.filter((b) => b.status === 'cancelled').length,
  }), [items]);

  return (
    <div>
      <div className="mb-4">
        <FilterBar
          value={filter}
          onChange={setFilter}
          getCount={(v) => counts[v]}
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
          <THead><TH>When</TH><TH>Service</TH><TH>Customer</TH><TH align="right">Price</TH><TH>Status</TH></THead>
          <TBody>{[1,2,3].map((i) => (
            <TR key={i} hover={false}>{[1,2,3,4,5].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>
          ))}</TBody>
        </Table>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Icon.Calendar}
          title="No bookings assigned"
          description="This user hasn't been assigned to any bookings in this filter. Service providers get assigned via the bookings page."
        />
      ) : (
        <Table>
          <THead>
            <TH>When</TH>
            <TH>Service</TH>
            <TH>Customer</TH>
            <TH align="right">Price</TH>
            <TH>Status</TH>
          </THead>
          <TBody>
            {items.map((b) => (
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
                  <div className="text-sm">{b.customer_name || <span className="text-dim">Anonymous</span>}</div>
                  {b.customer_email && <div className="text-xs text-dim">{b.customer_email}</div>}
                </TD>
                <TD align="right" className="mono-num font-semibold">${parseFloat(b.quoted_price || 0).toFixed(2)}</TD>
                <TD><Badge variant={STATUS_VARIANT[b.status] || 'gray'}>{b.status.replace('_', ' ')}</Badge></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

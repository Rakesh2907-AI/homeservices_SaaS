'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Badge, KpiCard, EmptyState, FilterBar,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const STATUS_VARIANT = {
  pending:    'amber',
  confirmed:  'blue',
  in_progress:'violet',
  completed:  'green',
  cancelled:  'red',
};

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const q = status === 'all' ? '?limit=200' : `?status=${status}&limit=200`;
    adminFetch(`/api/v1/admin/bookings${q}`)
      .then((r) => { setBookings(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [status]);

  const counts = useMemo(() => ({
    all:         bookings.length,
    pending:     bookings.filter((b) => b.status === 'pending').length,
    confirmed:   bookings.filter((b) => b.status === 'confirmed').length,
    in_progress: bookings.filter((b) => b.status === 'in_progress').length,
    completed:   bookings.filter((b) => b.status === 'completed').length,
    cancelled:   bookings.filter((b) => b.status === 'cancelled').length,
  }), [bookings]);

  const totalValue = bookings.reduce((s, b) => s + parseFloat(b.quoted_price || 0), 0);
  const completedValue = bookings.filter((b) => b.status === 'completed').reduce((s, b) => s + parseFloat(b.quoted_price || 0), 0);

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Tenants & Users"
          title="Bookings"
          description="Every booking across every tenant. Filter by status, jump to the originating business."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Bookings' }]}
          actions={
            <Button variant="secondary" size="sm">
              <Icon.Newspaper className="h-3.5 w-3.5" /> Export CSV
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard label="Total bookings" value={counts.all}                              hint="all statuses" accent="blue"    Ico={Icon.Calendar} loading={loading} />
        <KpiCard label="Completed"      value={counts.completed}                        hint={`$${completedValue.toFixed(0)} earned`} accent="emerald" Ico={Icon.Check} loading={loading} />
        <KpiCard label="Pipeline value" value={`$${totalValue.toFixed(0)}`}             hint="quoted total" accent="cyan"    Ico={Icon.Chart}     loading={loading} />
        <KpiCard label="Cancellation"   value={`${counts.all ? Math.round((counts.cancelled / counts.all) * 100) : 0}%`} hint={`${counts.cancelled} cancelled`} accent="rose" Ico={Icon.Bolt} loading={loading} />
      </div>

      <div className="mb-4">
        <FilterBar
          value={status}
          onChange={setStatus}
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
          <THead><TH>When</TH><TH>Tenant</TH><TH>Service</TH><TH>Customer</TH><TH>Status</TH><TH align="right">Price</TH></THead>
          <TBody>{[1,2,3,4].map((i) => (
            <TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-20" /></TD>)}</TR>
          ))}</TBody>
        </Table>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={Icon.Calendar}
          title="No bookings in this view"
          description="Try changing the status filter, or wait for new bookings to come in."
        />
      ) : (
        <Table>
          <THead>
            <TH>When</TH>
            <TH>Tenant</TH>
            <TH>Service</TH>
            <TH>Customer</TH>
            <TH>Status</TH>
            <TH align="right">Price</TH>
          </THead>
          <TBody>
            {bookings.map((b) => (
              <TR key={b.id}>
                <TD>
                  <div className="font-medium mono-num">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                  <div className="text-xs text-dim mono-num">{new Date(b.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </TD>
                <TD>
                  <Link href={`/admin/tenants/${b.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{b.business_name}</Link>
                  <div className="text-xs text-dim">{b.subdomain}</div>
                </TD>
                <TD>{b.service_title || <span className="text-dim">—</span>}</TD>
                <TD className="text-sm">{b.customer_name || <span className="text-dim">Anonymous</span>}</TD>
                <TD><Badge variant={STATUS_VARIANT[b.status] || 'gray'}>{b.status.replace('_', ' ')}</Badge></TD>
                <TD align="right" className="mono-num font-semibold">${parseFloat(b.quoted_price || 0).toFixed(2)}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

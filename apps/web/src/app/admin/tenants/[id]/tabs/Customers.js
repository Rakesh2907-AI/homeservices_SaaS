'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, EmptyState, Table, THead, TBody, TR, TH, TD, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function CustomersTab({ tenantId }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/customers`)
      .then((r) => { setCustomers(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  return (
    <Card padding="none">
      <div className="p-6 pb-4">
        <CardHeader
          title={`End customers (${customers.length})`}
          description="People who book the tenant's services. Sorted by lifetime spend."
        />
      </div>
      {loading ? (
        <div className="p-6 pt-0 space-y-2">{[1,2,3,4].map((i) => <Skeleton key={i} height={42} />)}</div>
      ) : customers.length === 0 ? (
        <div className="p-6 pt-0">
          <EmptyState icon={Icon.Map} title="No customers yet" description="The tenant hasn't taken any bookings, so no end customers exist yet." />
        </div>
      ) : (
        <Table className="border-0 rounded-none shadow-none">
          <THead>
            <TH>Customer</TH>
            <TH>Contact</TH>
            <TH>Address</TH>
            <TH align="right">Bookings</TH>
            <TH align="right">Total spend</TH>
            <TH>Last booking</TH>
          </THead>
          <TBody>
            {customers.map((c) => (
              <TR key={c.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-semibold">
                      {c.full_name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="font-medium">{c.full_name}</div>
                  </div>
                </TD>
                <TD>
                  <div className="text-xs text-muted">{c.email || ''}</div>
                  <div className="text-xs text-dim">{c.phone || ''}</div>
                </TD>
                <TD>
                  <div className="text-xs text-muted truncate max-w-[200px]">
                    {c.address?.line1 || ''} {c.address?.city || ''} {c.address?.state || ''}
                  </div>
                </TD>
                <TD align="right" className="mono-num">{c.booking_count}</TD>
                <TD align="right" className="mono-num font-semibold">${(c.total_spend || 0).toFixed(0)}</TD>
                <TD className="text-xs text-dim mono-num">{c.last_booking_at ? new Date(c.last_booking_at).toLocaleDateString() : '—'}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </Card>
  );
}

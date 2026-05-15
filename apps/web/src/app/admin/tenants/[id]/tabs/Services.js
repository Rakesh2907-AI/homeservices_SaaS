'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, Badge, EmptyState, Table, THead, TBody, TR, TH, TD, Skeleton, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function ServicesTab({ tenantId }) {
  const [data, setData] = useState({ services: [], categories: [] });
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    Promise.all([
      adminFetch(`/api/v1/admin/tenants/${tenantId}/services`),
      adminFetch(`/api/v1/admin/tenants/${tenantId}/commissions`),
    ]).then(([s, c]) => {
      setData(s); setCommissions(c.data); setLoading(false);
    }).catch(() => setLoading(false));
  }, [tenantId]);

  const parentCats = data.categories.filter((c) => !c.parent_category_id);
  const childrenByParent = data.categories
    .filter((c) => c.parent_category_id)
    .reduce((m, c) => { (m[c.parent_category_id] ||= []).push(c); return m; }, {});

  return (
    <div className="space-y-6">
      {/* Categories tree */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <CardHeader title={`Categories (${data.categories.length})`} description="How this tenant has grouped their offerings." />
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} height={28} />)}</div>
        ) : data.categories.length === 0 ? (
          <div className="p-6 pt-0"><EmptyState icon={Icon.Layers} title="No categories" description="The tenant hasn't created any service categories yet." /></div>
        ) : (
          <ul className="border-t border-gray-100 divide-y divide-gray-100">
            {parentCats.map((p) => (
              <li key={p.id}>
                <div className="px-6 py-2.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-xs text-dim mono-num">{p.service_count} services</span>
                </div>
                {(childrenByParent[p.id] || []).map((child) => (
                  <div key={child.id} className="px-6 py-2 pl-12 flex items-center justify-between text-sm bg-gray-50/40">
                    <span className="text-muted">↳ {child.name}</span>
                    <span className="text-xs text-dim mono-num">{child.service_count} services</span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Services table */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <CardHeader title={`Services (${data.services.length})`} description="Every service the tenant offers. Sorted by booking volume." />
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} height={42} />)}</div>
        ) : data.services.length === 0 ? (
          <div className="p-6 pt-0"><EmptyState icon={Icon.Bolt} title="No services" description="The tenant hasn't created any services yet." /></div>
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <THead>
              <TH>Service</TH>
              <TH>Category</TH>
              <TH align="right">Base price</TH>
              <TH align="right">Duration</TH>
              <TH align="right">Bookings</TH>
              <TH align="right">Revenue</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {data.services.map((s) => (
                <TR key={s.id}>
                  <TD>
                    <div className="font-medium">{s.title}</div>
                    {s.rule_count > 0 && <div className="text-xs text-dim mono-num">{s.rule_count} pricing rules</div>}
                  </TD>
                  <TD>{s.category_name ? <Badge variant="blue">{s.category_name}</Badge> : <span className="text-dim text-xs">—</span>}</TD>
                  <TD align="right" className="mono-num">{s.base_price ? `$${parseFloat(s.base_price).toFixed(2)}` : <span className="text-dim">—</span>}</TD>
                  <TD align="right" className="mono-num text-muted">{s.duration_mins ? `${s.duration_mins} min` : '—'}</TD>
                  <TD align="right" className="mono-num">{s.booking_count}</TD>
                  <TD align="right" className="mono-num font-semibold">${(s.revenue || 0).toFixed(0)}</TD>
                  <TD><StatusDot color={s.is_active ? 'emerald' : 'gray'} label={s.is_active ? 'Active' : 'Disabled'} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      {/* Commissions */}
      <Card padding="none">
        <div className="p-6 pb-4">
          <CardHeader title={`Commission rules (${commissions.length})`} description="How revenue is split between the platform, staff, and other parties." />
        </div>
        {loading ? (
          <div className="p-6 pt-0 space-y-2">{[1,2,3].map((i) => <Skeleton key={i} height={28} />)}</div>
        ) : commissions.length === 0 ? (
          <div className="p-6 pt-0"><EmptyState icon={Icon.Dollar} title="No commission rules" description="The tenant hasn't configured commission structures." /></div>
        ) : (
          <Table className="border-0 rounded-none shadow-none">
            <THead>
              <TH>Name</TH>
              <TH>Applies to</TH>
              <TH align="right">Rate</TH>
              <TH>Status</TH>
            </THead>
            <TBody>
              {commissions.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">{c.name}</TD>
                  <TD><Badge variant="violet">{c.applies_to}</Badge></TD>
                  <TD align="right" className="mono-num font-semibold">
                    {c.rate_type === 'percent' ? `${parseFloat(c.rate_value).toFixed(1)}%` : `$${parseFloat(c.rate_value).toFixed(2)}`}
                  </TD>
                  <TD><StatusDot color={c.is_active ? 'emerald' : 'gray'} label={c.is_active ? 'Active' : 'Disabled'} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

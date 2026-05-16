'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, CardHeader, Badge, Skeleton, money } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/plans')
      .then((r) => { setPlans(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function savePrice(plan, newPrice) {
    try {
      await adminFetch(`/api/v1/admin/plans/${plan.id}`, { method: 'PATCH', body: JSON.stringify({ price_monthly: parseFloat(newPrice) }) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Plans"
          description="Pricing tiers, feature inclusions, and resource limits. Change prices here — existing subscriptions keep their original rate."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Plans' }]}
          tabs={[
            { label: 'Overview',      href: '/admin/revenue' },
            { label: 'Subscriptions', href: '/admin/subscriptions' },
            { label: 'Invoices',      href: '/admin/invoices' },
            { label: 'Tax rates',     href: '/admin/taxes' },
            { label: 'Discounts',     href: '/admin/discounts' },
            { label: 'Plans',         href: '/admin/plans', active: true },
          ]}
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {loading ? [1,2,3].map((i) => <Skeleton key={i} height={280} className="rounded-2xl" />) : plans.map((p) => (
          <Card key={p.id}>
            <CardHeader
              title={<span className="capitalize">{p.name}</span>}
              description={`${p.tenant_count} ${p.tenant_count === 1 ? 'tenant' : 'tenants'} on this plan`}
              action={editing !== p.id && (
                <button onClick={() => setEditing(p.id)} className="text-xs text-blue-600 hover:underline font-medium">Edit</button>
              )}
            />

            <div className="mt-4">
              {editing === p.id ? (
                <PriceEditor initial={p.price_monthly} onCancel={() => setEditing(null)} onSave={(v) => savePrice(p, v)} />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight mono-num">{money(Math.round(parseFloat(p.price_monthly) * 100))}</span>
                  <span className="text-sm text-muted">/ month</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
              <div>
                <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Resource limits</div>
                <div className="space-y-1.5">
                  {Object.entries(p.resource_limits || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-muted capitalize">{k.replace('_', ' ')}</span>
                      <code className="font-mono text-xs">{String(v)}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Features</div>
                <div className="space-y-1.5">
                  {Object.entries(p.features || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-muted capitalize">{k.replace('_', ' ')}</span>
                      {v ? <Icon.Check className="h-4 w-4 text-emerald-500" /> : <span className="text-dim text-xs">—</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}

function PriceEditor({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-center gap-2">
      <span className="text-3xl text-gray-400">$</span>
      <input
        type="number" step="0.01" value={v} onChange={(e) => setV(e.target.value)}
        className="text-3xl font-bold w-28 border-b-2 border-gray-300 focus:border-blue-500 focus:outline-none mono-num"
      />
      <span className="text-sm text-muted">/ mo</span>
      <div className="ml-auto flex items-center gap-2">
        <Button onClick={() => onSave(v)} variant="primary" size="xs">Save</Button>
        <button onClick={onCancel} className="text-xs text-muted">Cancel</button>
      </div>
    </div>
  );
}

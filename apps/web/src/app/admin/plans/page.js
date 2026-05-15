'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // plan id being edited

  function load() {
    adminFetch('/api/v1/admin/plans').then((r) => setPlans(r.data)).catch((e) => setError(e.message));
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
    <AdminShell title="Subscription plans" subtitle="Pricing tiers, feature flags, and adoption.">
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold capitalize">{p.name}</h2>
              <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium">{p.tenant_count} tenants</span>
            </div>

            <div className="mt-4">
              {editing === p.id ? (
                <PriceEditor initial={p.price_monthly} onCancel={() => setEditing(null)} onSave={(v) => savePrice(p, v)} />
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">${parseFloat(p.price_monthly).toFixed(0)}</span>
                  <span className="text-sm text-gray-500">/ month</span>
                  <button onClick={() => setEditing(p.id)} className="ml-auto text-xs text-blue-600 hover:underline">Edit</button>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Resource limits</div>
                <div className="space-y-1">
                  {Object.entries(p.resource_limits || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{k.replace('_', ' ')}</span>
                      <code className="font-mono text-xs">{String(v)}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Features</div>
                <div className="space-y-1">
                  {Object.entries(p.features || {}).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 capitalize">{k.replace('_', ' ')}</span>
                      {v ? <Icon.Check className="h-4 w-4 text-emerald-500" /> : <span className="text-gray-400 text-xs">—</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}

function PriceEditor({ initial, onSave, onCancel }) {
  const [v, setV] = useState(initial);
  return (
    <div className="flex items-center gap-2">
      <span className="text-2xl text-gray-400">$</span>
      <input
        type="number" step="0.01" value={v} onChange={(e) => setV(e.target.value)}
        className="text-3xl font-bold w-24 border-b border-gray-300 focus:border-blue-500 focus:outline-none"
      />
      <button onClick={() => onSave(v)} className="text-xs rounded bg-blue-600 text-white px-2 py-1">Save</button>
      <button onClick={onCancel} className="text-xs text-gray-500">Cancel</button>
    </div>
  );
}

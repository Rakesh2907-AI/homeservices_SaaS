'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Badge, EmptyState, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function DiscountsPage() {
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/discount-codes').then((r) => setCodes(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = { ...form, discount_value: parseFloat(form.discount_value), max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null };
      if (payload.id) await adminFetch(`/api/v1/admin/discount-codes/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/discount-codes', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this discount code?')) return;
    try { await adminFetch(`/api/v1/admin/discount-codes/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Discount codes"
          description="Promo codes redeemable by tenants during signup or upgrade. Scope to a specific plan, set usage limits, and define an expiry window."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Discounts' }]}
          actions={
            <button onClick={() => setEditing({ code: '', name: '', discount_type: 'percent', discount_value: 20, scope: 'all', max_uses: '', valid_until: '', is_active: true })}
              className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New code</button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <DiscountEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {codes.length === 0 ? (
        <EmptyState
          icon={Icon.Star}
          title="No discount codes yet"
          description="Discount codes are an easy way to run promotions, reward early adopters, or close enterprise deals."
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Discount</th>
                <th className="px-6 py-3">Scope</th>
                <th className="px-6 py-3 text-right">Uses</th>
                <th className="px-6 py-3">Expires</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map((c) => {
                const remaining = c.max_uses ? c.max_uses - c.used_count : null;
                return (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3">
                      <code className="font-mono text-sm font-bold rounded bg-amber-50 text-amber-800 px-1.5 py-0.5">{c.code}</code>
                      <div className="text-xs text-gray-500 mt-1">{c.name}</div>
                    </td>
                    <td className="px-6 py-3 font-semibold">
                      {c.discount_type === 'percent' ? `${parseFloat(c.discount_value).toFixed(0)}%` : `$${parseFloat(c.discount_value).toFixed(2)}`}
                      <span className="ml-1 text-xs text-gray-500">{c.discount_type}</span>
                    </td>
                    <td className="px-6 py-3"><Badge variant="blue">{c.scope}</Badge></td>
                    <td className="px-6 py-3 text-right text-xs font-mono">
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                      {remaining != null && remaining < 10 && <div className="text-rose-600 text-[10px]">{remaining} left</div>}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-600">{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never'}</td>
                    <td className="px-6 py-3"><StatusDot color={c.is_active ? 'emerald' : 'gray'} label={c.is_active ? 'Active' : 'Disabled'} /></td>
                    <td className="px-6 py-3 text-right space-x-3">
                      <button onClick={() => setEditing({ ...c, valid_until: c.valid_until?.slice(0, 10) || '' })} className="text-xs text-blue-600 hover:underline">Edit</button>
                      <button onClick={() => remove(c.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function DiscountEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit code' : 'New discount code'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Code</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono uppercase" required maxLength={50} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Description</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Black Friday 2025" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Type</span>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}>
            <option value="percent">Percent</option>
            <option value="flat">Flat ($)</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Value</span>
          <input type="number" step="0.01" min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Scope</span>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
            <option value="all">All plans</option>
            <option value="plan:basic">Basic only</option>
            <option value="plan:pro">Pro only</option>
            <option value="plan:enterprise">Enterprise only</option>
          </select>
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Max uses</span>
          <input type="number" min="1" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="∞" value={form.max_uses || ''} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Valid until</span>
          <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.valid_until || ''} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
        </label>
        <label className="flex items-center gap-2 text-sm pt-5">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          Active
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

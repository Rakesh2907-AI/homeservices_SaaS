'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Badge, EmptyState, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function TaxesPage() {
  const [rates, setRates] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/tax-rates').then((r) => setRates(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function save(form) {
    try {
      if (form.id) await adminFetch(`/api/v1/admin/tax-rates/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await adminFetch('/api/v1/admin/tax-rates', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this tax rate?')) return;
    try { await adminFetch(`/api/v1/admin/tax-rates/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Tax rates"
          description="Jurisdictional tax rates applied to invoices. Tenants automatically inherit the rate matching their service address."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Tax rates' }]}
          actions={
            <button onClick={() => setEditing({ name: '', rate: 0, country: 'US', region: '', category: 'service', inclusive: false, is_active: true })}
              className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 inline-flex items-center gap-2">
              + New tax rate
            </button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <TaxEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {rates.length === 0 ? (
        <EmptyState
          icon={Icon.Layers}
          title="No tax rates configured"
          description="Add a tax rate to start collecting tax on subscriptions and service bookings. Rates are applied based on the customer's service address."
        />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Jurisdiction</th>
                <th className="px-6 py-3 text-right">Rate</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rates.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium">{r.name}</td>
                  <td className="px-6 py-3">
                    <span className="font-mono text-xs">{r.country}{r.region ? ` · ${r.region}` : ''}</span>
                    {r.postal_code_prefix && <span className="ml-1 text-xs text-gray-500">({r.postal_code_prefix})</span>}
                  </td>
                  <td className="px-6 py-3 text-right font-mono font-semibold">{(parseFloat(r.rate) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-3"><Badge variant="gray">{r.category}</Badge></td>
                  <td className="px-6 py-3"><StatusDot color={r.is_active ? 'emerald' : 'gray'} label={r.is_active ? 'Active' : 'Disabled'} /></td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <button onClick={() => setEditing(r)} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => remove(r.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminShell>
  );
}

function TaxEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, rate: parseFloat(form.rate) }); }}
      className="mb-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit tax rate' : 'New tax rate'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Name</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="California Sales Tax" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Rate (decimal, e.g. 0.0875 = 8.75%)</span>
          <input type="number" step="0.0001" min="0" max="1" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Country</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Region</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="CA, NY, …" value={form.region || ''} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">ZIP prefix</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="optional" value={form.postal_code_prefix || ''} onChange={(e) => setForm((f) => ({ ...f, postal_code_prefix: e.target.value }))} />
        </label>
        <label className="text-xs">
          <span className="block mb-1 text-gray-600 font-semibold uppercase tracking-wider">Category</span>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            <option value="service">Service</option>
            <option value="digital">Digital</option>
            <option value="physical">Physical</option>
          </select>
        </label>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.inclusive} onChange={(e) => setForm((f) => ({ ...f, inclusive: e.target.checked }))} />
          Inclusive (price already contains tax)
        </label>
        <label className="flex items-center gap-2 text-sm">
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

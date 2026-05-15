'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin-api';

export default function ServiceTemplatesPage() {
  const [services, setServices] = useState([]);
  const [cats, setCats] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    Promise.all([
      adminFetch('/api/v1/admin/service-templates'),
      adminFetch('/api/v1/admin/category-templates'),
    ]).then(([s, c]) => { setServices(s.data); setCats(c.data); }).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const catById = Object.fromEntries(cats.map((c) => [c.id, c]));

  async function save(form) {
    try {
      const payload = {
        ...form,
        default_price: form.default_price ? parseFloat(form.default_price) : null,
        default_duration_mins: form.default_duration_mins ? parseInt(form.default_duration_mins, 10) : null,
        default_pricing_rule: typeof form.default_pricing_rule === 'string' ? JSON.parse(form.default_pricing_rule || '{}') : form.default_pricing_rule,
      };
      if (payload.id) await adminFetch(`/api/v1/admin/service-templates/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/service-templates', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this service template?')) return;
    try { await adminFetch(`/api/v1/admin/service-templates/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Service library"
      subtitle="Pre-defined services tenants can apply during onboarding."
      actions={
        <button onClick={() => setEditing({ category_template_id: cats[0]?.id, title: '', description: '', default_price: '', default_duration_mins: 60, default_pricing_rule: { rule_type: 'flat', rate: 0 }, is_active: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New service</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ServiceEditor initial={editing} cats={cats} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3">Service</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3 text-right">Price</th>
              <th className="px-6 py-3 text-right">Duration</th>
              <th className="px-6 py-3">Pricing rule</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {services.map((s) => {
              const cat = catById[s.category_template_id];
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs text-gray-500">{s.description || ''}</div>
                  </td>
                  <td className="px-6 py-3">
                    {cat ? <><span className="text-xs uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{cat.industry}</span> <span className="text-xs ml-1">{cat.name}</span></> : '—'}
                  </td>
                  <td className="px-6 py-3 text-right font-mono">${s.default_price ?? '—'}</td>
                  <td className="px-6 py-3 text-right">{s.default_duration_mins ? `${s.default_duration_mins} min` : '—'}</td>
                  <td className="px-6 py-3"><code className="text-[10px] rounded bg-gray-100 px-1.5 py-0.5">{s.default_pricing_rule?.rule_type || '—'}</code></td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <button onClick={() => setEditing({ ...s, default_pricing_rule: JSON.stringify(s.default_pricing_rule || {}) })} className="text-xs text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => remove(s.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
            {services.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No service templates yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function ServiceEditor({ initial, cats, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit service' : 'New service'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Category</label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category_template_id || ''} onChange={(e) => setForm((f) => ({ ...f, category_template_id: e.target.value }))}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.industry} → {c.name}</option>)}
          </select>
        </div>
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Service title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-3 gap-3 mb-3">
        <input type="number" step="0.01" className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Default price" value={form.default_price || ''} onChange={(e) => setForm((f) => ({ ...f, default_price: e.target.value }))} />
        <input type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Duration (min)" value={form.default_duration_mins || ''} onChange={(e) => setForm((f) => ({ ...f, default_duration_mins: e.target.value }))} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
          Active
        </label>
      </div>
      <div className="mb-4">
        <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Default pricing rule (JSON)</label>
        <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" value={form.default_pricing_rule} onChange={(e) => setForm((f) => ({ ...f, default_pricing_rule: e.target.value }))} />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

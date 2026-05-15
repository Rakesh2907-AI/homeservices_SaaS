'use client';
import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function CategoryTemplatesPage() {
  const [cats, setCats] = useState([]);
  const [industry, setIndustry] = useState('');
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    const q = industry ? `?industry=${encodeURIComponent(industry)}` : '';
    adminFetch(`/api/v1/admin/category-templates${q}`).then((r) => setCats(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, [industry]); // eslint-disable-line

  const industries = useMemo(() => Array.from(new Set(cats.map((c) => c.industry))).sort(), [cats]);
  const parents = useMemo(() => cats.filter((c) => !c.parent_id), [cats]);
  const childrenByParent = useMemo(() => {
    const map = {};
    cats.filter((c) => c.parent_id).forEach((c) => {
      (map[c.parent_id] ||= []).push(c);
    });
    return map;
  }, [cats]);

  async function save(form) {
    try {
      if (form.id) await adminFetch(`/api/v1/admin/category-templates/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await adminFetch('/api/v1/admin/category-templates', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this category template?')) return;
    try { await adminFetch(`/api/v1/admin/category-templates/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Category library"
      subtitle="Reusable category templates tenants can apply during onboarding."
      actions={
        <button onClick={() => setEditing({ industry: industry || 'plumbing', name: '', description: '', parent_id: null, sort_order: 0, is_active: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New category</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-4 flex items-center gap-2 flex-wrap">
        <button onClick={() => setIndustry('')} className={`text-xs rounded-full px-3 py-1 font-medium ${!industry ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>All industries</button>
        {industries.map((i) => (
          <button key={i} onClick={() => setIndustry(i)} className={`text-xs rounded-full px-3 py-1 font-medium capitalize ${industry === i ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{i}</button>
        ))}
      </div>

      {editing && <CategoryEditor initial={editing} industries={industries} parents={parents} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <ul className="divide-y divide-gray-100">
          {parents.map((p) => (
            <li key={p.id}>
              <div className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">{p.industry}</span>
                  <span className="font-medium">{p.name}</span>
                  {!p.is_active && <span className="text-xs rounded-full bg-gray-200 text-gray-600 px-2 py-0.5">inactive</span>}
                </div>
                <div className="text-xs space-x-3">
                  <button onClick={() => setEditing(p)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(p.id)} className="text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
              {(childrenByParent[p.id] || []).map((child) => (
                <div key={child.id} className="px-6 py-2 ml-8 border-l-2 border-gray-100 flex items-center justify-between hover:bg-gray-50 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="text-gray-400">↳</span>
                    {child.name}
                    {!child.is_active && <span className="text-xs rounded-full bg-gray-200 text-gray-600 px-2 py-0.5">inactive</span>}
                  </div>
                  <div className="text-xs space-x-3">
                    <button onClick={() => setEditing(child)} className="text-blue-600 hover:underline">Edit</button>
                    <button onClick={() => remove(child.id)} className="text-rose-600 hover:underline">Delete</button>
                  </div>
                </div>
              ))}
            </li>
          ))}
          {parents.length === 0 && <li className="px-6 py-10 text-center text-sm text-gray-500">No category templates {industry ? `for ${industry}` : 'yet'}.</li>}
        </ul>
      </div>
    </AdminShell>
  );
}

function CategoryEditor({ initial, industries, parents, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const relevantParents = parents.filter((p) => p.industry === form.industry);
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit category' : 'New category'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Industry</label>
          <input list="industries" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value.toLowerCase() }))} />
          <datalist id="industries">{industries.map((i) => <option key={i} value={i} />)}</datalist>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-gray-500 font-semibold block mb-1">Parent (optional)</label>
          <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.parent_id || ''} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}>
            <option value="">— top level —</option>
            {relevantParents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Name (e.g. Drain Cleaning)" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Description (optional)" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 gap-3 mb-4">
        <input type="number" className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Sort order" value={form.sort_order || 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) }))} />
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

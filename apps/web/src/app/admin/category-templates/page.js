'use client';
import { useEffect, useMemo, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, CardHeader, Badge, EmptyState, FilterBar, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function CategoryTemplatesPage() {
  const [cats, setCats] = useState([]);
  const [industry, setIndustry] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    const q = industry ? `?industry=${encodeURIComponent(industry)}` : '';
    adminFetch(`/api/v1/admin/category-templates${q}`)
      .then((r) => { setCats(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, [industry]); // eslint-disable-line

  const industries = useMemo(() => Array.from(new Set(cats.map((c) => c.industry))).sort(), [cats]);
  const parents = useMemo(() => cats.filter((c) => !c.parent_id), [cats]);
  const childrenByParent = useMemo(() => {
    const m = {};
    cats.filter((c) => c.parent_id).forEach((c) => { (m[c.parent_id] ||= []).push(c); });
    return m;
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
      header={
        <PageHeader
          eyebrow="Content"
          title="Category library"
          description="Reusable service categories tenants can apply during onboarding — organized by industry."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Content' }, { label: 'Category library' }]}
          actions={
            <Button onClick={() => setEditing({ industry: industry || 'plumbing', name: '', description: '', parent_id: null, sort_order: 0, is_active: true })} variant="primary" size="sm">
              <Icon.Layers className="h-3.5 w-3.5" /> New category
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-4">
        <FilterBar
          value={industry || 'all'}
          onChange={(v) => setIndustry(v === 'all' ? '' : v)}
          options={[{ value: 'all', label: 'All industries' }, ...industries.map((i) => ({ value: i, label: i.charAt(0).toUpperCase() + i.slice(1) }))]}
        />
      </div>

      {editing && <CategoryEditor initial={editing} industries={industries} parents={parents} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <Card padding="none"><div className="p-6 space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} height={32} />)}</div></Card>
      ) : parents.length === 0 ? (
        <EmptyState icon={Icon.Layers} title={`No category templates ${industry ? `for ${industry}` : 'yet'}`} description="Add a template — tenants in this industry can apply it during onboarding." />
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-gray-100">
            {parents.map((p) => (
              <li key={p.id}>
                <div className="px-6 py-3 flex items-center justify-between hover:bg-gray-50/70 transition">
                  <div className="flex items-center gap-3">
                    <Badge variant="blue">{p.industry}</Badge>
                    <span className="font-medium">{p.name}</span>
                    {!p.is_active && <Badge variant="gray">inactive</Badge>}
                  </div>
                  <div className="text-xs space-x-3">
                    <button onClick={() => setEditing(p)} className="text-blue-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => remove(p.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                  </div>
                </div>
                {(childrenByParent[p.id] || []).map((child) => (
                  <div key={child.id} className="px-6 py-2 pl-12 flex items-center justify-between bg-gray-50/40 text-sm">
                    <div className="flex items-center gap-2 text-muted">
                      <span className="text-dim">↳</span>
                      {child.name}
                      {!child.is_active && <Badge variant="gray" size="sm">inactive</Badge>}
                    </div>
                    <div className="text-xs space-x-3">
                      <button onClick={() => setEditing(child)} className="text-blue-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => remove(child.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </AdminShell>
  );
}

function CategoryEditor({ initial, industries, parents, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const relevantParents = parents.filter((p) => p.industry === form.industry);
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit category' : 'New category'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Industry">
            <input list="industries" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.industry} onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value.toLowerCase() }))} />
            <datalist id="industries">{industries.map((i) => <option key={i} value={i} />)}</datalist>
          </Field>
          <Field label="Parent (optional)">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.parent_id || ''} onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value || null }))}>
              <option value="">— top level —</option>
              {relevantParents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Name"><input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></Field>
        <Field label="Description"><textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Sort order"><input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.sort_order || 0} onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) }))} /></Field>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
          </label>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button type="submit" variant="primary" size="sm">Save</Button>
          <button type="button" onClick={onCancel} className="text-sm text-muted">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-xs block">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin-api';

const TAGS = ['Feature', 'Improvement', 'Fix', 'Security', 'Breaking'];
const TAG_STYLES = {
  Feature:     'bg-blue-100 text-blue-700',
  Improvement: 'bg-emerald-100 text-emerald-700',
  Fix:         'bg-amber-100 text-amber-700',
  Security:    'bg-rose-100 text-rose-700',
  Breaking:    'bg-violet-100 text-violet-700',
};

export default function ChangelogAdminPage() {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/changelog-entries').then((r) => setEntries(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = {
        ...form,
        notes: typeof form.notes === 'string' ? form.notes.split('\n').map((l) => l.trim()).filter(Boolean) : form.notes,
      };
      if (payload.id) await adminFetch(`/api/v1/admin/changelog-entries/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/changelog-entries', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this changelog entry?')) return;
    try { await adminFetch(`/api/v1/admin/changelog-entries/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Changelog"
      subtitle="Release notes shown on the public marketing site."
      actions={
        <button onClick={() => setEditing({ version: '', title: '', tag: 'Feature', notes: [], released_at: new Date().toISOString().slice(0, 10), is_published: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New entry</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ChangelogEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="space-y-3">
        {entries.map((e) => (
          <article key={e.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <code className="font-mono text-sm font-bold">v{e.version}</code>
                  <span className="text-xs text-gray-500">{new Date(e.released_at).toLocaleDateString()}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${TAG_STYLES[e.tag]}`}>{e.tag}</span>
                  {!e.is_published && <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5 text-gray-600">Draft</span>}
                </div>
                <h3 className="font-semibold mb-2">{e.title}</h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                  {(e.notes || []).map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => setEditing({ ...e, notes: (e.notes || []).join('\n'), released_at: e.released_at?.slice(0, 10) })} className="text-xs text-blue-600 hover:underline">Edit</button>
                <button onClick={() => remove(e.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
              </div>
            </div>
          </article>
        ))}
        {entries.length === 0 && <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">No changelog entries yet.</div>}
      </div>
    </AdminShell>
  );
}

function ChangelogEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial, notes: Array.isArray(initial.notes) ? initial.notes.join('\n') : (initial.notes || '') });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit entry' : 'New entry'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="Version (e.g. 2.4.1)" required value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
        <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}>
          {TAGS.map((t) => <option key={t}>{t}</option>)}
        </select>
        <input type="date" className="rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.released_at} onChange={(e) => setForm((f) => ({ ...f, released_at: e.target.value }))} />
      </div>
      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold mb-3" placeholder="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      <textarea rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-3" placeholder="Notes (one per line)" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} />
        Publish on marketing site
      </label>
      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

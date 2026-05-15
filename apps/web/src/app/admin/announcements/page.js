'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const LEVEL_STYLES = {
  info:     'bg-blue-100 text-blue-700 border-blue-300',
  success:  'bg-emerald-100 text-emerald-700 border-emerald-300',
  warning:  'bg-amber-100 text-amber-700 border-amber-300',
  critical: 'bg-rose-100 text-rose-700 border-rose-300',
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/announcements').then((r) => setItems(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function save(payload) {
    try {
      if (payload.id) {
        await adminFetch(`/api/v1/admin/announcements/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await adminFetch('/api/v1/admin/announcements', { method: 'POST', body: JSON.stringify(payload) });
      }
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
      await adminFetch(`/api/v1/admin/announcements/${id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Announcements"
      subtitle="Platform-wide banners shown inside tenant dashboards."
      actions={
        <button onClick={() => setEditing({ title: '', body: '', level: 'info', audience: 'all', is_active: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
          + New announcement
        </button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <AnnouncementEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">
          No announcements yet. Click "+ New announcement" to broadcast a message to tenants.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <article key={a.id} className={`rounded-xl border-l-4 ${LEVEL_STYLES[a.level] || LEVEL_STYLES.info} bg-white border border-gray-200 p-5`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold">{a.title}</h3>
                    <span className={`text-[10px] uppercase tracking-wider rounded px-2 py-0.5 font-bold ${LEVEL_STYLES[a.level]}`}>{a.level}</span>
                    <span className="text-xs rounded-full bg-gray-100 text-gray-700 px-2 py-0.5">audience: {a.audience}</span>
                    {!a.is_active && <span className="text-xs rounded-full bg-gray-200 text-gray-600 px-2 py-0.5">inactive</span>}
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{a.body}</p>
                  <p className="text-[10px] text-gray-400 mt-2">
                    {a.starts_at && <>From {new Date(a.starts_at).toLocaleString()}</>}
                    {a.expires_at && <> · expires {new Date(a.expires_at).toLocaleString()}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(a)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(a.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function AnnouncementEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave(form); }}
      className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5"
    >
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit announcement' : 'New announcement'}</h2>
      <div className="space-y-3">
        <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Title" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Body" required value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.level} onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
          <select className="rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
            <option value="all">All tenants</option>
            <option value="plan:basic">Basic plan only</option>
            <option value="plan:pro">Pro plan only</option>
            <option value="plan:enterprise">Enterprise only</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
            Active
          </label>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

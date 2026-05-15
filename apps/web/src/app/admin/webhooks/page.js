'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ALL_EVENTS = [
  'tenant.created', 'tenant.suspended', 'tenant.reactivated',
  'user.created', 'user.deleted',
  'booking.created', 'booking.confirmed', 'booking.completed', 'booking.cancelled',
  'service.created', 'service.updated',
  'plan.upgraded', 'plan.downgraded',
];

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/webhooks').then((r) => setHooks(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function save(form) {
    try {
      if (form.id) await adminFetch(`/api/v1/admin/webhooks/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await adminFetch('/api/v1/admin/webhooks', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this webhook?')) return;
    try {
      await adminFetch(`/api/v1/admin/webhooks/${id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Webhooks"
      subtitle="Outbound HTTPS deliveries to your endpoints when platform events occur."
      actions={
        <button onClick={() => setEditing({ name: '', url: '', events: ['booking.created'], secret: '', is_active: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New webhook</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <WebhookEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {hooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">
          No webhooks configured yet. Webhooks let external systems react to platform events in real time.
        </div>
      ) : (
        <div className="space-y-3">
          {hooks.map((h) => (
            <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Icon.Zap className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold">{h.name}</h3>
                    <span className={`inline-flex items-center gap-1 text-xs ${h.is_active ? 'text-emerald-700' : 'text-gray-500'}`}><span className={`h-2 w-2 rounded-full ${h.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />{h.is_active ? 'Active' : 'Disabled'}</span>
                    {h.last_delivery_status && (
                      <span className={`text-xs rounded-full px-2 py-0.5 ${h.last_delivery_status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>Last: {h.last_delivery_status}</span>
                    )}
                  </div>
                  <code className="block font-mono text-xs text-gray-600 mt-1 truncate">{h.url}</code>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(h.events || []).map((e) => <code key={e} className="text-[10px] rounded bg-blue-100 text-blue-700 px-1.5 py-0.5">{e}</code>)}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => setEditing(h)} className="text-xs text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => remove(h.id)} className="text-xs text-rose-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function WebhookEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  function toggleEvent(e) {
    setForm((f) => ({ ...f, events: f.events.includes(e) ? f.events.filter((x) => x !== e) : [...f.events, e] }));
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit webhook' : 'New webhook'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <input type="url" className="rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="https://your.endpoint/webhook" required value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
      </div>
      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono mb-3" placeholder="Signing secret (optional)" value={form.secret || ''} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} />

      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Subscribed events</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_EVENTS.map((e) => (
            <label key={e} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs cursor-pointer hover:border-blue-300">
              <input type="checkbox" checked={form.events.includes(e)} onChange={() => toggleEvent(e)} />
              <code className="font-mono">{e}</code>
            </label>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm mb-4">
        <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
        Active
      </label>

      <div className="flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

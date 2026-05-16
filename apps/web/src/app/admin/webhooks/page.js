'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, CardHeader, Badge, EmptyState, StatusDot, Skeleton } from '@/components/admin/ui';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/webhooks')
      .then((r) => { setHooks(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
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
    try { await adminFetch(`/api/v1/admin/webhooks/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform"
          title="Webhooks"
          description="Outbound HTTPS deliveries to your endpoints when platform events occur. Configure events, signing secret, and active state."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Platform' }, { label: 'Webhooks' }]}
          actions={
            <Button onClick={() => setEditing({ name: '', url: '', events: ['booking.created'], secret: '', is_active: true })} variant="primary" size="sm">
              <Icon.Zap className="h-3.5 w-3.5" /> New webhook
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <WebhookEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} height={100} className="rounded-2xl" />)}</div>
      ) : hooks.length === 0 ? (
        <EmptyState
          icon={Icon.Zap}
          title="No webhooks configured yet"
          description="Webhooks let external systems react to platform events in real time — useful for Slack alerts, CRM syncs, or custom integrations."
          action={<Button onClick={() => setEditing({ name: '', url: '', events: ['booking.created'], secret: '', is_active: true })} variant="primary" size="sm">Create first webhook</Button>}
        />
      ) : (
        <div className="space-y-3">
          {hooks.map((h) => (
            <Card key={h.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <Icon.Zap className="h-4 w-4 text-amber-500" />
                    <h3 className="font-semibold text-gray-900">{h.name}</h3>
                    <StatusDot color={h.is_active ? 'emerald' : 'gray'} label={h.is_active ? 'Active' : 'Disabled'} />
                    {h.last_delivery_status && (
                      <Badge variant={h.last_delivery_status === 'success' ? 'green' : 'red'}>
                        Last: {h.last_delivery_status}
                      </Badge>
                    )}
                  </div>
                  <code className="block font-mono text-xs text-muted mt-2 truncate">{h.url}</code>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(h.events || []).map((e) => <code key={e} className="text-[10px] rounded bg-blue-50 text-blue-700 px-1.5 py-0.5 font-mono">{e}</code>)}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <button onClick={() => setEditing(h)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => remove(h.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function WebhookEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  function toggleEvent(e) { setForm((f) => ({ ...f, events: f.events.includes(e) ? f.events.filter((x) => x !== e) : [...f.events, e] })); }
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit webhook' : 'New webhook'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="URL">
            <input type="url" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="https://your.endpoint/webhook" required value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          </Field>
        </div>
        <Field label="Signing secret (optional)">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" value={form.secret || ''} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))} />
        </Field>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Subscribed events</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_EVENTS.map((e) => (
              <label key={e} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs cursor-pointer hover:border-blue-300">
                <input type="checkbox" checked={form.events.includes(e)} onChange={() => toggleEvent(e)} />
                <code className="font-mono">{e}</code>
              </label>
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
        </label>
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
    <label className="text-xs">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

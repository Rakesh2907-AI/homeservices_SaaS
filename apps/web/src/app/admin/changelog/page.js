'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, CardHeader, Badge, EmptyState, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const TAGS = ['Feature', 'Improvement', 'Fix', 'Security', 'Breaking'];
const TAG_VARIANT = { Feature: 'blue', Improvement: 'green', Fix: 'amber', Security: 'red', Breaking: 'violet' };

export default function ChangelogAdminPage() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/changelog-entries')
      .then((r) => { setEntries(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = { ...form, notes: typeof form.notes === 'string' ? form.notes.split('\n').map((l) => l.trim()).filter(Boolean) : form.notes };
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
      header={
        <PageHeader
          eyebrow="Content"
          title="Changelog"
          description="Release notes shown on the public marketing site. Tag each entry, summarize the change, list highlights."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Content' }, { label: 'Changelog' }]}
          actions={
            <Button onClick={() => setEditing({ version: '', title: '', tag: 'Feature', notes: [], released_at: new Date().toISOString().slice(0, 10), is_published: true })} variant="primary" size="sm">
              <Icon.Layers className="h-3.5 w-3.5" /> New entry
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ChangelogEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <div className="space-y-3">{[1,2,3].map((i) => <Skeleton key={i} height={120} className="rounded-2xl" />)}</div>
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Icon.Layers}
          title="No changelog entries yet"
          description="Each release should add an entry here so customers know what shipped."
          action={<Button onClick={() => setEditing({ version: '', title: '', tag: 'Feature', notes: [], released_at: new Date().toISOString().slice(0, 10), is_published: true })} variant="primary" size="sm">Add first entry</Button>}
        />
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <Card key={e.id}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <code className="font-mono text-sm font-bold">v{e.version}</code>
                    <span className="text-xs text-muted mono-num">{new Date(e.released_at).toLocaleDateString()}</span>
                    <Badge variant={TAG_VARIANT[e.tag] || 'gray'}>{e.tag}</Badge>
                    {!e.is_published && <Badge variant="gray">Draft</Badge>}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{e.title}</h3>
                  <ul className="text-sm text-muted space-y-1 list-disc pl-5">
                    {(e.notes || []).map((n, i) => <li key={i}>{n}</li>)}
                  </ul>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <button onClick={() => setEditing({ ...e, notes: (e.notes || []).join('\n'), released_at: e.released_at?.slice(0, 10) })} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => remove(e.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AdminShell>
  );
}

function ChangelogEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial, notes: Array.isArray(initial.notes) ? initial.notes.join('\n') : (initial.notes || '') });
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit entry' : 'New entry'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Version">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" placeholder="2.4.1" required value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
          </Field>
          <Field label="Tag">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.tag} onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}>
              {TAGS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Released">
            <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.released_at} onChange={(e) => setForm((f) => ({ ...f, released_at: e.target.value }))} />
          </Field>
        </div>
        <Field label="Title">
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </Field>
        <Field label="Notes (one per line)">
          <textarea rows={6} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={!!form.is_published} onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))} /> Publish on marketing site
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
    <label className="text-xs block">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

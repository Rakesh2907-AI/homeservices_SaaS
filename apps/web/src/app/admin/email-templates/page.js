'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, Badge, EmptyState, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function EmailTemplatesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/email-templates').then((r) => {
      setItems(r.data);
      if (!selected && r.data.length) setSelected(r.data[0]);
      setLoading(false);
    }).catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []); // eslint-disable-line

  async function save() {
    if (!selected) return;
    setSaving(true);
    try {
      const { id, ...rest } = selected;
      const updated = await adminFetch(`/api/v1/admin/email-templates/${id}`, { method: 'PATCH', body: JSON.stringify(rest) });
      setItems((prev) => prev.map((t) => t.id === id ? updated : t));
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform"
          title="Email templates"
          description="System-wide emails sent to tenants and their customers. Use {{mustache}} placeholders — the rendering layer substitutes them per recipient."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Platform' }, { label: 'Email templates' }]}
          actions={selected && (
            <Button onClick={save} variant="primary" size="sm" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          )}
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
          <Skeleton height={400} className="rounded-2xl" />
          <Skeleton height={500} className="rounded-2xl" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState icon={Icon.Mail} title="No templates yet" description="Email templates are seeded via the database migrations." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
          <Card padding="none">
            <ul className="divide-y divide-gray-100">
              {items.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => setSelected(t)}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selected?.id === t.id ? 'bg-blue-50/60 border-l-2 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm truncate">{t.name}</span>
                      {!t.is_active && <Badge variant="gray" size="sm">off</Badge>}
                    </div>
                    <code className="text-[10px] font-mono text-dim mt-0.5 block">{t.template_key}</code>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            {!selected ? <p className="text-sm text-muted">Select a template.</p> : (
              <>
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                  <h2 className="h2 flex items-center gap-2"><Icon.Mail className="h-4 w-4 text-blue-600" /> {selected.name}</h2>
                  <label className="flex items-center gap-2 text-sm text-muted">
                    <input type="checkbox" checked={!!selected.is_active} onChange={(e) => setSelected((t) => ({ ...t, is_active: e.target.checked }))} />
                    Active
                  </label>
                </div>

                <Field label="Subject">
                  <input type="text" value={selected.subject} onChange={(e) => setSelected((t) => ({ ...t, subject: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
                </Field>

                <Field label="Body (HTML)">
                  <textarea rows={10} value={selected.body_html} onChange={(e) => setSelected((t) => ({ ...t, body_html: e.target.value }))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" />
                </Field>

                <div className="mb-4">
                  <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Available variables</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selected.variables || []).map((v) => (
                      <code key={v} className="text-xs rounded bg-gray-100 px-2 py-1 font-mono">{`{{${v}}}`}</code>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 bg-gray-50/60 p-4">
                  <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Preview</div>
                  <div className="text-sm font-semibold mb-2 text-gray-900">{selected.subject}</div>
                  <div className="text-sm prose prose-sm max-w-none text-gray-700" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </AdminShell>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block mb-1.5 text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">{label}</span>
      {children}
    </label>
  );
}

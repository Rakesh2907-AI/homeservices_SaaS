'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function ServiceTemplatesPage() {
  const [services, setServices] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    Promise.all([
      adminFetch('/api/v1/admin/service-templates'),
      adminFetch('/api/v1/admin/category-templates'),
    ]).then(([s, c]) => { setServices(s.data); setCats(c.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
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
      header={
        <PageHeader
          eyebrow="Content"
          title="Service library"
          description="Pre-defined services tenants can apply during onboarding — each linked to a category template with a default price, duration, and pricing rule."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Content' }, { label: 'Service library' }]}
          actions={
            <Button onClick={() => setEditing({ category_template_id: cats[0]?.id, title: '', description: '', default_price: '', default_duration_mins: 60, default_pricing_rule: { rule_type: 'flat', rate: 0 }, is_active: true })} variant="primary" size="sm">
              <Icon.Bolt className="h-3.5 w-3.5" /> New service
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ServiceEditor initial={editing} cats={cats} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <Table>
          <THead><TH>Service</TH><TH>Category</TH><TH align="right">Price</TH><TH align="right">Duration</TH><TH>Rule</TH><TH /></THead>
          <TBody>{[1,2,3,4].map((i) => (<TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>))}</TBody>
        </Table>
      ) : services.length === 0 ? (
        <EmptyState
          icon={Icon.Bolt}
          title="No service templates yet"
          description="Service templates speed up tenant onboarding — they can apply a full catalog with one click."
          action={<Button onClick={() => setEditing({ category_template_id: cats[0]?.id, title: '', default_price: 100, default_duration_mins: 60, is_active: true })} variant="primary" size="sm">Add first template</Button>}
        />
      ) : (
        <Table>
          <THead>
            <TH>Service</TH>
            <TH>Category</TH>
            <TH align="right">Default price</TH>
            <TH align="right">Duration</TH>
            <TH>Pricing rule</TH>
            <TH />
          </THead>
          <TBody>
            {services.map((s) => {
              const cat = catById[s.category_template_id];
              return (
                <TR key={s.id}>
                  <TD>
                    <div className="font-medium">{s.title}</div>
                    {s.description && <div className="text-xs text-dim truncate max-w-[280px]">{s.description}</div>}
                  </TD>
                  <TD>
                    {cat ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="blue">{cat.industry}</Badge>
                        <span className="text-xs text-muted">{cat.name}</span>
                      </div>
                    ) : <span className="text-dim">—</span>}
                  </TD>
                  <TD align="right" className="mono-num font-semibold">{s.default_price ? `$${parseFloat(s.default_price).toFixed(2)}` : <span className="text-dim">—</span>}</TD>
                  <TD align="right" className="mono-num text-muted">{s.default_duration_mins ? `${s.default_duration_mins} min` : '—'}</TD>
                  <TD><code className="text-[10px] rounded bg-gray-100 px-1.5 py-0.5">{s.default_pricing_rule?.rule_type || '—'}</code></TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button onClick={() => setEditing({ ...s, default_pricing_rule: JSON.stringify(s.default_pricing_rule || {}) })} className="text-blue-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => remove(s.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

function ServiceEditor({ initial, cats, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit service' : 'New service'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Category">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category_template_id || ''} onChange={(e) => setForm((f) => ({ ...f, category_template_id: e.target.value }))}>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.industry} → {c.name}</option>)}
            </select>
          </Field>
          <Field label="Title"><input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></Field>
        </div>
        <Field label="Description"><textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Default price"><input type="number" step="0.01" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.default_price || ''} onChange={(e) => setForm((f) => ({ ...f, default_price: e.target.value }))} /></Field>
          <Field label="Duration (min)"><input type="number" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.default_duration_mins || ''} onChange={(e) => setForm((f) => ({ ...f, default_duration_mins: e.target.value }))} /></Field>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
          </label>
        </div>
        <Field label="Default pricing rule (JSON)">
          <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" value={form.default_pricing_rule} onChange={(e) => setForm((f) => ({ ...f, default_pricing_rule: e.target.value }))} />
        </Field>
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

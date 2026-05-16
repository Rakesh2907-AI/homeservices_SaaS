'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { Button, Card, CardHeader, Badge, EmptyState, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function ThemesPage() {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/theme-presets')
      .then((r) => { setThemes(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = { ...form, config: typeof form.config === 'string' ? JSON.parse(form.config) : form.config };
      if (payload.id) await adminFetch(`/api/v1/admin/theme-presets/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/theme-presets', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function toggleActive(t) {
    try {
      await adminFetch(`/api/v1/admin/theme-presets/${t.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !t.is_active }) });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform"
          title="Theme library"
          description="Curated presets tenants pick from in their onboarding wizard. Each theme defines CSS variables applied to the customer portal."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Platform' }, { label: 'Themes' }]}
          actions={
            <Button onClick={() => setEditing({ slug: '', name: '', description: '', config: { primary_color: '#0066cc', secondary_color: '#00b8d9', background_color: '#ffffff', text_color: '#0f172a', font_family: 'Inter, system-ui, sans-serif' }, is_active: true })} variant="primary" size="sm">
              <Icon.Palette className="h-3.5 w-3.5" /> New theme
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ThemeEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? [1,2,3,4,5,6].map((i) => <Skeleton key={i} height={280} className="rounded-2xl" />) : themes.map((t) => {
          const cfg = t.config || {};
          return (
            <Card key={t.id} className={!t.is_active ? 'opacity-60' : ''}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="h2 flex items-center gap-2">
                    {t.name}
                    {!t.is_active && <Badge variant="gray">inactive</Badge>}
                  </h3>
                  <code className="font-mono text-[10px] text-dim">slug: {t.slug}</code>
                </div>
                <div className="text-xs flex gap-2">
                  <button onClick={() => setEditing(t)} className="text-blue-600 hover:underline font-medium">Edit</button>
                  <button onClick={() => toggleActive(t)} className="text-muted hover:text-gray-900">{t.is_active ? 'Disable' : 'Enable'}</button>
                </div>
              </div>

              <p className="text-xs text-muted mb-4 min-h-[2.5rem] leading-relaxed">{t.description}</p>

              <div className="flex gap-1.5 mb-4">
                {['primary_color', 'secondary_color', 'background_color', 'text_color'].map((k) => cfg[k] && (
                  <div key={k} title={`${k}: ${cfg[k]}`} className="h-10 w-10 rounded-md border border-gray-200" style={{ background: cfg[k] }} />
                ))}
              </div>

              <div className="rounded-md border border-gray-100 p-3" style={{ background: cfg.background_color, color: cfg.text_color }}>
                <div className="text-sm font-semibold mb-1.5" style={{ color: cfg.primary_color }}>Preview</div>
                <div className="flex gap-2">
                  <button className="rounded px-2 py-1 text-xs font-medium text-white" style={{ background: cfg.primary_color }}>Book</button>
                  <button className="rounded px-2 py-1 text-xs font-medium text-white" style={{ background: cfg.secondary_color }}>Quote</button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </AdminShell>
  );
}

function ThemeEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial });
  function setColor(field, value) { setForm((f) => ({ ...f, config: { ...f.config, [field]: value } })); }

  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit theme' : 'New theme'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Slug">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
          </Field>
          <Field label="Display name">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
        </div>
        <Field label="Description">
          <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['primary_color', 'secondary_color', 'background_color', 'text_color'].map((k) => (
            <Field key={k} label={k.replace('_', ' ')}>
              <div className="flex items-center gap-1">
                <input type="color" value={form.config[k] || '#000000'} onChange={(e) => setColor(k, e.target.value)} className="h-9 w-12 border border-gray-300 rounded cursor-pointer" />
                <input type="text" value={form.config[k] || ''} onChange={(e) => setColor(k, e.target.value)} className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-mono" />
              </div>
            </Field>
          ))}
        </div>
        <Field label="Font family">
          <input type="text" value={form.config.font_family || ''} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, font_family: e.target.value } }))} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-mono" />
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
    <label className="text-xs">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider capitalize">{label}</span>
      {children}
    </label>
  );
}

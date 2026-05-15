'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function ThemesPage() {
  const [themes, setThemes] = useState([]);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/theme-presets').then((r) => setThemes(r.data)).catch((e) => setError(e.message));
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
      title="Theme library"
      subtitle="Presets tenants can pick from in the onboarding wizard."
      actions={
        <button onClick={() => setEditing({ slug: '', name: '', description: '', config: { primary_color: '#0066cc', secondary_color: '#00b8d9', background_color: '#ffffff', text_color: '#0f172a', font_family: 'Inter, system-ui, sans-serif' }, is_active: true })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">
          + New theme
        </button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <ThemeEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((t) => {
          const cfg = t.config || {};
          return (
            <div key={t.id} className={`rounded-xl border bg-white p-5 ${t.is_active ? 'border-gray-200' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">{t.name}{!t.is_active && <span className="text-xs rounded-full bg-gray-200 px-2 py-0.5 text-gray-600">inactive</span>}</h3>
                  <code className="font-mono text-[10px] text-gray-500">slug: {t.slug}</code>
                </div>
                <div className="text-xs flex gap-2">
                  <button onClick={() => setEditing(t)} className="text-blue-600 hover:underline">Edit</button>
                  <button onClick={() => toggleActive(t)} className="text-gray-500 hover:text-gray-900">{t.is_active ? 'Disable' : 'Enable'}</button>
                </div>
              </div>

              <p className="text-xs text-gray-600 mb-4 min-h-[2rem]">{t.description}</p>

              <div className="flex gap-1.5 mb-4">
                {['primary_color', 'secondary_color', 'background_color', 'text_color'].map((k) => cfg[k] && (
                  <div key={k} title={`${k}: ${cfg[k]}`} className="h-10 w-10 rounded border border-gray-200" style={{ background: cfg[k] }} />
                ))}
              </div>

              <div className="rounded-md bg-gray-50 border border-gray-100 p-3" style={{ background: cfg.background_color, color: cfg.text_color }}>
                <div className="text-sm font-semibold mb-1" style={{ color: cfg.primary_color }}>Preview</div>
                <div className="flex gap-2">
                  <button className="rounded px-2 py-1 text-xs font-medium text-white" style={{ background: cfg.primary_color }}>Book</button>
                  <button className="rounded px-2 py-1 text-xs font-medium" style={{ background: cfg.secondary_color, color: 'white' }}>Quote</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AdminShell>
  );
}

function ThemeEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState({ ...initial });

  function setColor(field, value) {
    setForm((f) => ({ ...f, config: { ...f.config, [field]: value } }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">{initial.id ? 'Edit theme' : 'New theme'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Slug (e.g. ocean)" required pattern="[a-z0-9-]+" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value.toLowerCase() }))} />
        <input className="rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Display name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      </div>
      <textarea rows={2} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-4" placeholder="Description" value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        {['primary_color', 'secondary_color', 'background_color', 'text_color'].map((k) => (
          <label key={k} className="text-xs">
            <span className="block mb-1 text-gray-600 capitalize">{k.replace('_', ' ')}</span>
            <div className="flex items-center gap-1">
              <input type="color" value={form.config[k] || '#000000'} onChange={(e) => setColor(k, e.target.value)} className="h-9 w-12 border border-gray-300 rounded cursor-pointer" />
              <input type="text" value={form.config[k] || ''} onChange={(e) => setColor(k, e.target.value)} className="flex-1 rounded-md border border-gray-300 px-2 py-1.5 text-xs font-mono" />
            </div>
          </label>
        ))}
      </div>
      <label className="text-xs">
        <span className="block mb-1 text-gray-600">Font family</span>
        <input type="text" value={form.config.font_family || ''} onChange={(e) => setForm((f) => ({ ...f, config: { ...f.config, font_family: e.target.value } }))} className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs font-mono" />
      </label>
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Save</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

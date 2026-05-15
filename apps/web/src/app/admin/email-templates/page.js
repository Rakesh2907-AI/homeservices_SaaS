'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function EmailTemplatesPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/email-templates').then((r) => {
      setItems(r.data);
      if (!selected && r.data.length) setSelected(r.data[0]);
    }).catch((e) => setError(e.message));
  }
  useEffect(load, []); // eslint-disable-line

  async function save() {
    if (!selected) return;
    try {
      const { id, ...rest } = selected;
      const updated = await adminFetch(`/api/v1/admin/email-templates/${id}`, { method: 'PATCH', body: JSON.stringify(rest) });
      setItems((prev) => prev.map((t) => t.id === id ? updated : t));
      alert('Saved');
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell title="Email templates" subtitle="System-wide email content. Use {{mustache}} placeholders.">
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-6">
        {/* Sidebar list */}
        <aside className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {items.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelected(t)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${selected?.id === t.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon.Mail className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-sm">{t.name}</span>
                  </div>
                  <code className="text-[10px] font-mono text-gray-500 mt-1 block">{t.template_key}</code>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          {!selected ? <p className="text-sm text-gray-500">Select a template.</p> : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold flex items-center gap-2">
                  <Icon.Mail className="h-4 w-4" /> {selected.name}
                </h2>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input type="checkbox" checked={!!selected.is_active} onChange={(e) => setSelected((t) => ({ ...t, is_active: e.target.checked }))} />
                  Active
                </label>
              </div>

              <label className="block mb-3">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Subject</span>
                <input type="text" value={selected.subject} onChange={(e) => setSelected((t) => ({ ...t, subject: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
              </label>

              <label className="block mb-3">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Body (HTML)</span>
                <textarea rows={10} value={selected.body_html} onChange={(e) => setSelected((t) => ({ ...t, body_html: e.target.value }))} className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" />
              </label>

              <div className="mb-4">
                <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Available variables</span>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(selected.variables || []).map((v) => (
                    <code key={v} className="text-xs rounded bg-gray-100 px-2 py-1 font-mono">{`{{${v}}}`}</code>
                  ))}
                </div>
              </div>

              <div className="rounded-md border border-gray-100 bg-gray-50 p-4 mb-4">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Preview</div>
                <div className="text-sm font-medium mb-2">{selected.subject}</div>
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: selected.body_html }} />
              </div>

              <button onClick={save} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">Save changes</button>
            </>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

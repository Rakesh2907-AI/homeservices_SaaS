'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ALL_SCOPES = ['tenants:read', 'tenants:write', 'bookings:read', 'bookings:write', 'users:read', 'analytics:read'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);
  const [reveal, setReveal] = useState(null); // { name, plaintext } shown ONCE after create

  function load() {
    adminFetch('/api/v1/admin/api-keys').then((r) => setKeys(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function create(form) {
    try {
      const created = await adminFetch('/api/v1/admin/api-keys', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setReveal({ name: created.name, plaintext: created.plaintext });
      setCreating(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function toggle(k) {
    try {
      await adminFetch(`/api/v1/admin/api-keys/${k.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !k.is_active }) });
      load();
    } catch (e) { setError(e.message); }
  }

  async function revoke(id) {
    if (!confirm('Permanently revoke this API key?')) return;
    try {
      await adminFetch(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="API keys"
      subtitle="Platform-level credentials for the public REST API."
      actions={
        <button onClick={() => setCreating({ name: '', scopes: ['bookings:read'] })} className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">+ New API key</button>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* One-time reveal */}
      {reveal && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-5">
          <h3 className="font-semibold text-amber-900 mb-1 flex items-center gap-2"><Icon.Shield className="h-4 w-4" /> Save this key now</h3>
          <p className="text-sm text-amber-800 mb-4">This is the only time the full secret will be shown. Store it in a secure place — we only keep a bcrypt hash.</p>
          <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2">
            <code className="flex-1 font-mono text-xs break-all select-all">{reveal.plaintext}</code>
            <button onClick={() => navigator.clipboard.writeText(reveal.plaintext)} className="text-xs rounded border border-amber-400 bg-amber-100 px-2 py-1">Copy</button>
          </div>
          <button onClick={() => setReveal(null)} className="mt-3 text-xs text-amber-700 underline">I&apos;ve saved it — dismiss</button>
        </div>
      )}

      {creating && <ApiKeyCreator initial={creating} onCancel={() => setCreating(null)} onCreate={create} />}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
              <th className="px-6 py-3">Key</th>
              <th className="px-6 py-3">Scopes</th>
              <th className="px-6 py-3">Created</th>
              <th className="px-6 py-3">Last used</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {keys.map((k) => (
              <tr key={k.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <div className="font-medium">{k.name}</div>
                  <code className="font-mono text-[10px] text-gray-500">{k.key_prefix}…</code>
                </td>
                <td className="px-6 py-3"><div className="flex flex-wrap gap-1">{(k.scopes || []).map((s) => <code key={s} className="text-[10px] rounded bg-gray-100 px-1.5 py-0.5">{s}</code>)}</div></td>
                <td className="px-6 py-3 text-xs text-gray-500">{new Date(k.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-3 text-xs text-gray-500">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</td>
                <td className="px-6 py-3"><span className={`inline-flex items-center gap-1.5 text-xs ${k.is_active ? 'text-emerald-700' : 'text-gray-500'}`}><span className={`h-2 w-2 rounded-full ${k.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />{k.is_active ? 'Active' : 'Disabled'}</span></td>
                <td className="px-6 py-3 text-right space-x-3">
                  <button onClick={() => toggle(k)} className="text-xs text-gray-600 hover:text-gray-900">{k.is_active ? 'Disable' : 'Enable'}</button>
                  <button onClick={() => revoke(k.id)} className="text-xs text-rose-600 hover:underline">Revoke</button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No API keys yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </AdminShell>
  );
}

function ApiKeyCreator({ initial, onCancel, onCreate }) {
  const [form, setForm] = useState(initial);
  function toggleScope(s) {
    setForm((f) => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] }));
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); onCreate(form); }} className="mb-6 rounded-xl border border-blue-200 bg-blue-50/50 p-5">
      <h2 className="font-semibold mb-4">New API key</h2>
      <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm mb-4" placeholder="Key name (e.g. Production backend)" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
      <div>
        <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Scopes</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ALL_SCOPES.map((s) => (
            <label key={s} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-blue-300">
              <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} />
              <code className="font-mono text-xs">{s}</code>
            </label>
          ))}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium">Generate key</button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600">Cancel</button>
      </div>
    </form>
  );
}

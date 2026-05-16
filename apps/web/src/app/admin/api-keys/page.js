'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState, StatusDot,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ALL_SCOPES = ['tenants:read', 'tenants:write', 'bookings:read', 'bookings:write', 'users:read', 'analytics:read'];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(null);
  const [reveal, setReveal] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/api-keys').then((r) => { setKeys(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function create(form) {
    try {
      const created = await adminFetch('/api/v1/admin/api-keys', { method: 'POST', body: JSON.stringify(form) });
      setReveal({ name: created.name, plaintext: created.plaintext });
      setCreating(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function toggle(k) {
    try { await adminFetch(`/api/v1/admin/api-keys/${k.id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !k.is_active }) }); load(); }
    catch (e) { setError(e.message); }
  }

  async function revoke(id) {
    if (!confirm('Permanently revoke this API key?')) return;
    try { await adminFetch(`/api/v1/admin/api-keys/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Platform"
          title="API keys"
          description="Platform-level credentials for the public REST API. Each key has a scope set and can be revoked instantly."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Platform' }, { label: 'API keys' }]}
          actions={
            <Button onClick={() => setCreating({ name: '', scopes: ['bookings:read'] })} variant="primary" size="sm">
              <Icon.Code className="h-3.5 w-3.5" /> New API key
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* One-time reveal */}
      {reveal && (
        <Card className="mb-6 border-amber-300 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <Icon.Shield className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">Save this key now</h3>
              <p className="text-sm text-amber-800 mb-3">This is the only time the full secret will be shown. Store it somewhere safe — we only keep a bcrypt hash.</p>
              <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-white px-3 py-2">
                <code className="flex-1 font-mono text-xs break-all select-all">{reveal.plaintext}</code>
                <button onClick={() => navigator.clipboard.writeText(reveal.plaintext)} className="text-xs rounded border border-amber-400 bg-amber-100 px-2 py-1 font-medium">Copy</button>
              </div>
              <button onClick={() => setReveal(null)} className="mt-3 text-xs text-amber-700 underline">Dismiss</button>
            </div>
          </div>
        </Card>
      )}

      {creating && <ApiKeyCreator initial={creating} onCancel={() => setCreating(null)} onCreate={create} />}

      {loading ? (
        <Table>
          <THead><TH>Key</TH><TH>Scopes</TH><TH>Created</TH><TH>Last used</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3].map((i) => (<TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>))}</TBody>
        </Table>
      ) : keys.length === 0 ? (
        <EmptyState
          icon={Icon.Code}
          title="No API keys yet"
          description="Generate a key to authenticate calls to the public REST API."
          action={<Button onClick={() => setCreating({ name: '', scopes: ['bookings:read'] })} variant="primary" size="sm">Generate first key</Button>}
        />
      ) : (
        <Table>
          <THead><TH>Key</TH><TH>Scopes</TH><TH>Created</TH><TH>Last used</TH><TH>Status</TH><TH /></THead>
          <TBody>
            {keys.map((k) => (
              <TR key={k.id}>
                <TD>
                  <div className="font-medium">{k.name}</div>
                  <code className="font-mono text-[10px] text-dim">{k.key_prefix}…</code>
                </TD>
                <TD>
                  <div className="flex flex-wrap gap-1">{(k.scopes || []).map((s) => <code key={s} className="text-[10px] rounded bg-gray-100 px-1.5 py-0.5">{s}</code>)}</div>
                </TD>
                <TD className="text-xs text-muted mono-num">{new Date(k.created_at).toLocaleDateString()}</TD>
                <TD className="text-xs text-muted mono-num">{k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}</TD>
                <TD><StatusDot color={k.is_active ? 'emerald' : 'gray'} label={k.is_active ? 'Active' : 'Disabled'} /></TD>
                <TD align="right">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <button onClick={() => toggle(k)} className="text-muted hover:text-gray-900 font-medium">{k.is_active ? 'Disable' : 'Enable'}</button>
                    <button onClick={() => revoke(k.id)} className="text-rose-600 hover:underline font-medium">Revoke</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

function ApiKeyCreator({ initial, onCancel, onCreate }) {
  const [form, setForm] = useState(initial);
  function toggleScope(s) { setForm((f) => ({ ...f, scopes: f.scopes.includes(s) ? f.scopes.filter((x) => x !== s) : [...f.scopes, s] })); }
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title="New API key" />
      <form onSubmit={(e) => { e.preventDefault(); onCreate(form); }} className="mt-4 space-y-4">
        <label className="block">
          <span className="block mb-1.5 text-[10px] uppercase tracking-[0.08em] font-semibold text-muted">Key name</span>
          <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Production backend" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </label>
        <div>
          <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Scopes</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_SCOPES.map((s) => (
              <label key={s} className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm cursor-pointer hover:border-blue-300">
                <input type="checkbox" checked={form.scopes.includes(s)} onChange={() => toggleScope(s)} />
                <code className="font-mono text-xs">{s}</code>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button type="submit" variant="primary" size="sm">Generate key</Button>
          <button type="button" onClick={onCancel} className="text-sm text-muted">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [error, setError] = useState(null);
  const [newFlag, setNewFlag] = useState({ flag_key: '', tenant_id: '', is_enabled: false });

  function load() {
    Promise.all([
      adminFetch('/api/v1/admin/feature-flags'),
      adminFetch('/api/v1/admin/tenants?limit=200'),
    ]).then(([f, t]) => { setFlags(f.data); setTenants(t.data); }).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  async function toggle(flag) {
    try {
      await adminFetch(`/api/v1/admin/feature-flags/${flag.id}`, { method: 'PATCH', body: JSON.stringify({ is_enabled: !flag.is_enabled }) });
      load();
    } catch (e) { setError(e.message); }
  }

  async function createFlag(e) {
    e.preventDefault();
    if (!newFlag.flag_key) return;
    try {
      await adminFetch('/api/v1/admin/feature-flags', { method: 'POST', body: JSON.stringify({
        flag_key: newFlag.flag_key,
        tenant_id: newFlag.tenant_id || null,
        is_enabled: newFlag.is_enabled,
      }) });
      setNewFlag({ flag_key: '', tenant_id: '', is_enabled: false });
      load();
    } catch (err) { setError(err.message); }
  }

  const globalFlags = flags.filter((f) => !f.tenant_id);
  const tenantFlags = flags.filter((f) => f.tenant_id);

  return (
    <AdminShell title="Feature flags" subtitle="Toggle features globally or per-tenant.">
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Create */}
      <form onSubmit={createFlag} className="rounded-xl border border-gray-200 bg-white p-4 mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Flag key</label>
          <input
            required value={newFlag.flag_key}
            onChange={(e) => setNewFlag((f) => ({ ...f, flag_key: e.target.value }))}
            placeholder="e.g. new-scheduling-algorithm"
            className="w-full font-mono rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="min-w-[200px]">
          <label className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mb-1">Scope</label>
          <select
            value={newFlag.tenant_id} onChange={(e) => setNewFlag((f) => ({ ...f, tenant_id: e.target.value }))}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Global (all tenants)</option>
            {tenants.map((t) => <option key={t.tenant_id} value={t.tenant_id}>{t.business_name}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm pb-2">
          <input type="checkbox" checked={newFlag.is_enabled} onChange={(e) => setNewFlag((f) => ({ ...f, is_enabled: e.target.checked }))} />
          Enabled
        </label>
        <button type="submit" className="rounded-md bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800">Create / Update</button>
      </form>

      {/* Global flags */}
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Global flags ({globalFlags.length})</h2>
      <FlagList flags={globalFlags} onToggle={toggle} />

      <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mt-8 mb-3">Per-tenant overrides ({tenantFlags.length})</h2>
      <FlagList flags={tenantFlags} onToggle={toggle} showTenant />
    </AdminShell>
  );
}

function FlagList({ flags, onToggle, showTenant = false }) {
  if (!flags.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
        No flags here yet.
      </div>
    );
  }
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <ul className="divide-y divide-gray-100">
        {flags.map((f) => (
          <li key={f.id} className="px-6 py-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Icon.Bolt className="h-4 w-4 text-amber-500" />
                <code className="font-mono text-sm font-medium">{f.flag_key}</code>
                {showTenant && f.business_name && (
                  <span className="text-xs text-gray-500">on <strong>{f.business_name}</strong></span>
                )}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">Updated {new Date(f.updated_at).toLocaleString()}</div>
            </div>
            <Toggle on={f.is_enabled} onChange={() => onToggle(f)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${on ? 'bg-emerald-500' : 'bg-gray-300'}`}
      aria-pressed={on}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${on ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

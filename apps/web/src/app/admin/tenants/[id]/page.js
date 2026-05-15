'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminShell, { StatCard } from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function TenantDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    adminFetch(`/api/v1/admin/tenants/${id}`).then(setData).catch((e) => setError(e.message));
  }

  useEffect(() => { if (id) load(); }, [id]);

  async function update(patch) {
    try {
      await adminFetch(`/api/v1/admin/tenants/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      load();
    } catch (e) { setError(e.message); }
  }

  if (error) {
    return <AdminShell title="Tenant"><div className="rounded-md bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">{error}</div></AdminShell>;
  }

  if (!data) {
    return <AdminShell title="Tenant"><div className="text-sm text-gray-500">Loading…</div></AdminShell>;
  }

  const t = data.tenant;

  return (
    <AdminShell
      title={t.business_name}
      subtitle={
        <span className="flex items-center gap-2">
          <Icon.Globe className="h-3.5 w-3.5" /> {t.subdomain}.servicehub.app
          <span className={`ml-2 inline-flex items-center gap-1 text-xs ${t.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
            {t.is_active ? 'Active' : 'Suspended'}
          </span>
        </span>
      }
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/tenants" className="text-sm text-gray-600 hover:text-gray-900">← Back to list</Link>
          <button
            onClick={() => update({ is_active: !t.is_active })}
            className={`rounded-md text-sm px-3 py-1.5 font-medium ${t.is_active ? 'border border-rose-300 text-rose-700 hover:bg-rose-50' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
          >
            {t.is_active ? 'Suspend tenant' : 'Reactivate'}
          </button>
        </div>
      }
    >
      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Users" value={t.user_count} gradient="from-violet-500 to-purple-500" Ico={Icon.Shield} />
        <StatCard label="Services" value={t.service_count} gradient="from-amber-500 to-orange-500" Ico={Icon.Bolt} />
        <StatCard label="Customers" value={t.customer_count} gradient="from-cyan-500 to-blue-500" Ico={Icon.Map} />
        <StatCard label="Bookings" value={t.booking_count} gradient="from-emerald-500 to-teal-500" Ico={Icon.Calendar} />
        <StatCard label="Commissions" value={t.commission_count} gradient="from-rose-500 to-pink-500" Ico={Icon.Dollar} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
          <div>
            <div className="flex items-center gap-4">
              {t.logo_url ? (
                <img src={t.logo_url} alt="logo" className="h-14 w-14 rounded-lg border bg-white object-contain" />
              ) : (
                <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500" />
              )}
              <div>
                <h2 className="font-semibold">{t.business_name}</h2>
                <p className="text-xs text-gray-500">Tenant ID: <code className="font-mono">{t.tenant_id.slice(0, 8)}…</code></p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <Row label="Plan">
              <select
                value={t.plan_tier} onChange={(e) => update({ plan_tier: e.target.value })}
                className="text-xs rounded-md border border-gray-300 px-2 py-1 capitalize"
              >
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Row>
            <Row label="Subdomain"><code className="font-mono text-xs">{t.subdomain}</code></Row>
            <Row label="Custom domain"><code className="font-mono text-xs">{t.custom_domain || '—'}</code></Row>
            <Row label="Created">{new Date(t.created_at).toLocaleString()}</Row>
            <Row label="Updated">{new Date(t.updated_at).toLocaleString()}</Row>
            <Row label="Onboarded">{t.onboarding_status?.completed ? '✓ Yes' : `Step: ${t.onboarding_status?.current_step || '—'}`}</Row>
          </div>

          {t.business_details && Object.keys(t.business_details).length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Business details</div>
              <pre className="text-[11px] bg-gray-50 border border-gray-100 rounded p-3 overflow-x-auto font-mono text-gray-700">{JSON.stringify(t.business_details, null, 2)}</pre>
            </div>
          )}

          {t.theme_config && Object.keys(t.theme_config).length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">Theme</div>
              <div className="flex flex-wrap gap-2">
                {t.theme_config.primary_color && <ColorSwatch label="Primary" hex={t.theme_config.primary_color} />}
                {t.theme_config.secondary_color && <ColorSwatch label="Secondary" hex={t.theme_config.secondary_color} />}
                {t.theme_config.background_color && <ColorSwatch label="BG" hex={t.theme_config.background_color} />}
              </div>
            </div>
          )}
        </div>

        {/* Users */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold">Users <span className="text-xs text-gray-500 font-normal">({data.users.length})</span></h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
            {data.users.map((u) => (
              <li key={u.id} className="px-6 py-3">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{u.full_name || u.email}</div>
                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                  </div>
                  <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 capitalize">{u.role.replace('_', ' ')}</span>
                </div>
                {u.last_login_at && <div className="text-[10px] text-gray-400 mt-1">Last login: {new Date(u.last_login_at).toLocaleString()}</div>}
              </li>
            ))}
            {data.users.length === 0 && <li className="px-6 py-8 text-center text-sm text-gray-500">No users yet.</li>}
          </ul>
        </div>

        {/* Recent bookings */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold">Recent bookings <span className="text-xs text-gray-500 font-normal">({data.recent_bookings.length})</span></h2>
          </div>
          <ul className="divide-y divide-gray-100 max-h-[460px] overflow-y-auto">
            {data.recent_bookings.map((b) => (
              <li key={b.id} className="px-6 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="capitalize">{b.status}</span>
                  <span className="font-semibold">${b.quoted_price ?? '—'}</span>
                </div>
                <div className="text-xs text-gray-500">{new Date(b.scheduled_at).toLocaleString()}</div>
              </li>
            ))}
            {data.recent_bookings.length === 0 && <li className="px-6 py-8 text-center text-sm text-gray-500">No bookings yet.</li>}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function ColorSwatch({ label, hex }) {
  return (
    <div className="flex items-center gap-2 rounded border border-gray-200 px-2 py-1">
      <span className="inline-block h-4 w-4 rounded" style={{ background: hex }} />
      <span className="text-[11px] text-gray-600">{label}</span>
      <code className="text-[10px] font-mono text-gray-500">{hex}</code>
    </div>
  );
}

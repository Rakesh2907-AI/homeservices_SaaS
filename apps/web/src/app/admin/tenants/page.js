'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function TenantsList() {
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter] = useState('');
  const [plan, setPlan] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/v1/admin/tenants?limit=200').then((r) => setTenants(r.data)).catch((e) => setError(e.message));
  }, []);

  const filtered = useMemo(() => {
    return tenants.filter((t) => {
      if (plan !== 'all' && t.plan_tier !== plan) return false;
      if (!filter.trim()) return true;
      const q = filter.toLowerCase();
      return t.business_name.toLowerCase().includes(q) || t.subdomain.toLowerCase().includes(q);
    });
  }, [tenants, filter, plan]);

  async function toggleActive(t) {
    try {
      await adminFetch(`/api/v1/admin/tenants/${t.tenant_id}`, { method: 'PATCH', body: JSON.stringify({ is_active: !t.is_active }) });
      setTenants((prev) => prev.map((x) => x.tenant_id === t.tenant_id ? { ...x, is_active: !t.is_active } : x));
    } catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      title="Tenants"
      subtitle="Every business on the platform."
      actions={
        <span className="text-sm text-gray-500">
          {filtered.length} of {tenants.length}
        </span>
      }
    >
      {error && (
        <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>
      )}

      {/* Filters */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6 flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Icon.MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search" value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by business name or subdomain…"
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={plan} onChange={(e) => setPlan(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All plans</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">Business</th>
                <th className="px-6 py-3">Plan</th>
                <th className="px-6 py-3 text-right">Users</th>
                <th className="px-6 py-3 text-right">Bookings</th>
                <th className="px-6 py-3">Created</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((t) => (
                <tr key={t.tenant_id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <Link href={`/admin/tenants/${t.tenant_id}`} className="font-medium text-gray-900 hover:text-blue-600">{t.business_name}</Link>
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Icon.Globe className="h-3 w-3" /> {t.subdomain}.servicehub.app
                      {t.onboarded === 'true' && <span className="ml-2 text-emerald-600">✓ onboarded</span>}
                    </div>
                  </td>
                  <td className="px-6 py-3"><span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium capitalize">{t.plan_tier}</span></td>
                  <td className="px-6 py-3 text-right font-mono">{t.user_count}</td>
                  <td className="px-6 py-3 text-right font-mono">{t.booking_count}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${t.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                      <span className={`h-2 w-2 rounded-full ${t.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {t.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right space-x-3">
                    <Link href={`/admin/tenants/${t.tenant_id}`} className="text-xs text-blue-600 hover:underline">View</Link>
                    <button onClick={() => toggleActive(t)} className="text-xs text-gray-600 hover:text-rose-600">
                      {t.is_active ? 'Suspend' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="px-6 py-10 text-center text-sm text-gray-500">No tenants match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

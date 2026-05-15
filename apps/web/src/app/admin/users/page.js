'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = encodeURIComponent(search);
    adminFetch(`/api/v1/admin/users?search=${q}&limit=200`).then((r) => setUsers(r.data)).catch((e) => setError(e.message));
  }, [search]);

  const roleColor = {
    super_admin: 'bg-rose-100 text-rose-700',
    business_admin: 'bg-blue-100 text-blue-700',
    staff: 'bg-emerald-100 text-emerald-700',
    viewer: 'bg-gray-100 text-gray-700',
  };

  return (
    <AdminShell
      title="Users"
      subtitle="Every user across every tenant."
      actions={<span className="text-sm text-gray-500">{users.length} results</span>}
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6">
        <div className="relative">
          <Icon.MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name (server-side)…"
            className="w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">User</th>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Last login</th>
                <th className="px-6 py-3">Joined</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {(u.full_name || u.email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{u.full_name || '—'}</div>
                        <div className="text-xs text-gray-500 truncate">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/tenants/${u.tenant_id}`} className="text-sm hover:text-blue-600">{u.business_name}</Link>
                    <div className="text-xs text-gray-500">{u.subdomain}</div>
                  </td>
                  <td className="px-6 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${roleColor[u.role] || 'bg-gray-100 text-gray-700'}`}>{u.role.replace('_', ' ')}</span></td>
                  <td className="px-6 py-3 text-xs text-gray-600">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</td>
                  <td className="px-6 py-3 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs ${u.is_active ? 'text-emerald-700' : 'text-gray-500'}`}>
                      <span className={`h-2 w-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {u.is_active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No users match the current search.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

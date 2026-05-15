'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin-api';

const ACTION_STYLES = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-rose-100 text-rose-700',
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    adminFetch('/api/v1/admin/audit-logs?limit=500').then((r) => setLogs(r.data)).catch((e) => setError(e.message));
  }, []);

  return (
    <AdminShell
      title="Audit logs"
      subtitle="Every privileged action recorded across every tenant."
      actions={<span className="text-sm text-gray-500">{logs.length} entries</span>}
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {logs.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-3">When</th>
                  <th className="px-6 py-3">Action</th>
                  <th className="px-6 py-3">Entity</th>
                  <th className="px-6 py-3">Actor</th>
                  <th className="px-6 py-3">Tenant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">{new Date(a.created_at).toLocaleString()}</td>
                    <td className="px-6 py-3"><span className={`text-xs rounded px-2 py-0.5 font-bold ${ACTION_STYLES[a.action] || 'bg-gray-100 text-gray-700'}`}>{a.action}</span></td>
                    <td className="px-6 py-3"><span className="text-sm">{a.entity_type}</span><div className="text-[10px] font-mono text-gray-400">{a.entity_id.slice(0, 8)}…</div></td>
                    <td className="px-6 py-3 text-sm">{a.actor_email || <span className="text-gray-400">unknown</span>}</td>
                    <td className="px-6 py-3"><Link href={`/admin/tenants/${a.tenant_id}`} className="text-sm hover:text-blue-600">{a.business_name}</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminShell>
  );
}

'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch, getAdminUser } from '@/lib/admin-api';

export default function SettingsPage() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setUser(getAdminUser());
    adminFetch('/api/v1/admin/stats').then(setStats).catch((e) => setError(e.message));
  }, []);

  return (
    <AdminShell title="Settings" subtitle="Platform configuration and operator profile.">
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Operator profile */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Icon.Shield className="h-4 w-4" /> Operator profile</h2>
          <div className="space-y-3 text-sm">
            <Row label="Full name">{user?.full_name || '—'}</Row>
            <Row label="Email"><code className="font-mono text-xs">{user?.email}</code></Row>
            <Row label="Role"><span className="text-xs rounded-full bg-rose-100 text-rose-700 px-2 py-0.5 font-medium">{user?.role}</span></Row>
            <Row label="User ID"><code className="font-mono text-[10px]">{user?.id?.slice(0, 8)}…</code></Row>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Password rotation, MFA, and SSO are roadmap items for the Enterprise tier.
          </p>
        </div>

        {/* Environment */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Icon.Code className="h-4 w-4" /> Environment</h2>
          <div className="space-y-3 text-sm">
            <Row label="API base"><code className="font-mono text-xs">{process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000'}</code></Row>
            <Row label="Sandbox banner">{process.env.NEXT_PUBLIC_SHOW_SANDBOX_CREDS !== 'false' ? 'Visible' : 'Hidden'}</Row>
            <Row label="Build">{process.env.NODE_ENV || 'development'}</Row>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Set <code className="font-mono text-[10px]">NEXT_PUBLIC_SHOW_SANDBOX_CREDS=false</code> to hide the sandbox banner on /admin/login in production.
          </p>
        </div>

        {/* Platform footprint */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Icon.Globe className="h-4 w-4" /> Platform footprint</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Fact label="Tenants" value={stats?.tenants ?? '—'} />
            <Fact label="Users" value={stats?.users ?? '—'} />
            <Fact label="Bookings" value={stats?.bookings ?? '—'} />
            <Fact label="Services" value={stats?.services ?? '—'} />
          </div>
        </div>

        {/* Danger zone */}
        <div className="lg:col-span-2 rounded-xl border border-rose-200 bg-rose-50/40 p-6">
          <h2 className="font-semibold text-rose-700 mb-3 flex items-center gap-2"><Icon.Shield className="h-4 w-4" /> Danger zone</h2>
          <p className="text-sm text-rose-700/90 mb-4">
            Destructive operations are intentionally not exposed here. Use the database directly with
            <code className="mx-1 font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-rose-200">withSuperAdmin()</code>
            for irreversible work — and record what you did in the audit log.
          </p>
          <ul className="text-xs text-rose-700/80 space-y-1 list-disc pl-5">
            <li>Bulk-deleting tenants → use <code className="font-mono">DELETE FROM tenants WHERE …</code> directly</li>
            <li>Resetting a tenant's password → invalidate their sessions and use the password-reset flow</li>
            <li>Force-reindexing audit logs → run the maintenance job manually</li>
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Fact({ label, value }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Card, CardHeader, Button, Badge, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ROLES = [
  { value: 'business_admin', label: 'Business admin',  desc: 'Owner / manager — full access to the tenant.' },
  { value: 'staff',          label: 'Service provider', desc: 'Field technician — receives bookings, earns commission.' },
  { value: 'viewer',         label: 'Viewer',           desc: 'Read-only access. Cannot make changes.' },
];

export default function SettingsTab({ tenantId, userId, data, onRefresh }) {
  const u = data?.user;
  const [role, setRole] = useState(u?.role || 'staff');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  if (!u) return null;

  async function changeRole() {
    if (role === u.role) return;
    setBusy('role'); setError(null);
    try {
      await adminFetch(`/api/v1/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'PATCH', body: JSON.stringify({ role }),
      });
      onRefresh?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  async function toggleActive() {
    setBusy('active'); setError(null);
    try {
      await adminFetch(`/api/v1/admin/tenants/${tenantId}/users/${userId}`, {
        method: 'PATCH', body: JSON.stringify({ is_active: !u.is_active }),
      });
      onRefresh?.();
    } catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  return (
    <div className="space-y-5">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Identity */}
      <Card>
        <CardHeader title="Identity" description="Read-only fields managed by the tenant." />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <Row label="Full name">{u.full_name || <span className="text-dim">—</span>}</Row>
          <Row label="Email"><code className="font-mono text-xs">{u.email}</code></Row>
          <Row label="Role"><Badge variant={u.role === 'business_admin' ? 'blue' : u.role === 'staff' ? 'green' : 'gray'}>{u.role.replace('_', ' ')}</Badge></Row>
          <Row label="Status"><StatusDot color={u.is_active ? 'emerald' : 'gray'} label={u.is_active ? 'Active' : 'Disabled'} /></Row>
          <Row label="User ID"><code className="font-mono text-[10px]">{u.id}</code></Row>
          <Row label="Tenant ID"><code className="font-mono text-[10px]">{u.tenant_id?.slice(0, 8)}…</code></Row>
          <Row label="Created">{new Date(u.created_at).toLocaleString()}</Row>
          <Row label="Last login">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : <span className="text-dim italic">Never</span>}</Row>
        </div>
      </Card>

      {/* Role */}
      <Card>
        <CardHeader
          title="Role"
          description="Changing a user's role takes effect on their next sign-in. Service providers earn commission based on the tenant's rule."
          action={
            <Button onClick={changeRole} variant="primary" size="sm" disabled={busy === 'role' || role === u.role}>
              {busy === 'role' ? 'Saving…' : 'Apply role change'}
            </Button>
          }
        />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {ROLES.map((r) => (
            <label key={r.value} className={`relative rounded-lg border-2 p-4 cursor-pointer transition ${role === r.value ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" className="sr-only" checked={role === r.value} onChange={() => setRole(r.value)} />
              <div className="flex items-center justify-between">
                <span className="font-semibold">{r.label}</span>
                {role === r.value && <Icon.Check className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="mt-1 text-xs text-muted">{r.desc}</div>
              {u.role === r.value && <div className="mt-2 text-[10px] uppercase tracking-wider font-semibold text-emerald-700">Current</div>}
            </label>
          ))}
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title="Security" description="Sign-in security and credential management." />
        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-4">
            <div>
              <div className="font-medium text-sm">Force password reset</div>
              <p className="text-xs text-muted mt-0.5">Sends a reset link to <code className="font-mono text-[10px]">{u.email}</code>. Their current password keeps working until they complete the reset.</p>
            </div>
            <Button variant="secondary" size="sm" disabled>Send reset</Button>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-gray-200 p-4">
            <div>
              <div className="font-medium text-sm">Invalidate all sessions</div>
              <p className="text-xs text-muted mt-0.5">Signs the user out of every device. They'll need to log in again with their existing password.</p>
            </div>
            <Button variant="secondary" size="sm" disabled>Sign out everywhere</Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader title="Danger zone" description="Irreversible operations." />
        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-md border border-rose-200 bg-white p-4">
            <div>
              <div className="font-medium text-sm">{u.is_active ? 'Disable account' : 'Re-enable account'}</div>
              <p className="text-xs text-muted mt-0.5">
                {u.is_active
                  ? 'Prevents this user from signing in. Their data is preserved and they can be reactivated at any time.'
                  : 'Restores sign-in access. The user can log in with their existing password.'}
              </p>
            </div>
            <Button onClick={toggleActive} variant={u.is_active ? 'destructive' : 'accent'} size="sm" disabled={busy === 'active'}>
              {busy === 'active' ? '…' : u.is_active ? 'Disable' : 'Re-enable'}
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-rose-200 bg-white p-4">
            <div>
              <div className="font-medium text-sm">Delete user</div>
              <p className="text-xs text-muted mt-0.5">
                Permanently removes the user. Their historical bookings and audit-log entries are kept but show as "unassigned".
                Not exposed in the admin UI yet — use the DB directly.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>Not exposed</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

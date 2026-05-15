'use client';
import { useEffect, useMemo, useState } from 'react';
import { Badge, EmptyState, FilterBar, Table, THead, TBody, TR, TH, TD, Skeleton, StatusDot } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ROLE_VARIANT = {
  super_admin:    'red',
  business_admin: 'blue',
  staff:          'green',
  viewer:         'gray',
};

/**
 * Users tab. Two-section split:
 *   1. Top stat strip — counts by role
 *   2. Filterable user list with last-login and status
 *
 * Service providers (role: staff) are highlighted as a distinct section since
 * the admin asked to be able to see them specifically.
 */
export default function UsersTab({ tenantId }) {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/users`)
      .then((r) => { setUsers(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const counts = useMemo(() => ({
    all: users.length,
    business_admin: users.filter((u) => u.role === 'business_admin').length,
    staff: users.filter((u) => u.role === 'staff').length,
    viewer: users.filter((u) => u.role === 'viewer').length,
  }), [users]);

  const filtered = useMemo(() => role === 'all' ? users : users.filter((u) => u.role === role), [users, role]);

  return (
    <div>
      {/* Role split */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <RoleCard label="Total users"        value={counts.all}            color="gray"   Ico={Icon.Shield} />
        <RoleCard label="Business admins"    value={counts.business_admin} color="blue"   Ico={Icon.Lock} hint="Owner/manager access" />
        <RoleCard label="Service providers"  value={counts.staff}          color="green"  Ico={Icon.Bolt} hint="Field staff / technicians" />
        <RoleCard label="Viewers"            value={counts.viewer}         color="gray"   Ico={Icon.Globe} hint="Read-only access" />
      </div>

      <div className="mb-4">
        <FilterBar
          value={role}
          onChange={setRole}
          getCount={(v) => counts[v]}
          options={[
            { value: 'all',            label: 'All' },
            { value: 'business_admin', label: 'Admins' },
            { value: 'staff',          label: 'Service providers' },
            { value: 'viewer',         label: 'Viewers' },
          ]}
        />
      </div>

      {loading ? (
        <Table>
          <THead><TH>User</TH><TH>Role</TH><TH>Status</TH><TH>Last login</TH><TH>Joined</TH></THead>
          <TBody>{[1,2,3].map((i) => (
            <TR key={i} hover={false}>{[1,2,3,4,5].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>
          ))}</TBody>
        </Table>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Icon.Shield}
          title="No users in this filter"
          description="Try changing the role filter — or the tenant may not have added any users yet."
        />
      ) : (
        <Table>
          <THead>
            <TH>User</TH>
            <TH>Role</TH>
            <TH>Status</TH>
            <TH>Last login</TH>
            <TH>Joined</TH>
          </THead>
          <TBody>
            {filtered.map((u) => (
              <TR key={u.id}>
                <TD>
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                      {(u.full_name || u.email).split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{u.full_name || '—'}</div>
                      <div className="text-xs text-dim truncate">{u.email}</div>
                    </div>
                  </div>
                </TD>
                <TD><Badge variant={ROLE_VARIANT[u.role] || 'gray'}>{u.role.replace('_', ' ')}</Badge></TD>
                <TD><StatusDot color={u.is_active ? 'emerald' : 'gray'} label={u.is_active ? 'Active' : 'Disabled'} /></TD>
                <TD className="text-xs text-muted mono-num">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}</TD>
                <TD className="text-xs text-dim mono-num">{new Date(u.created_at).toLocaleDateString()}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}

function RoleCard({ label, value, hint, color, Ico }) {
  const colorMap = {
    gray:  'bg-gray-50  text-gray-700',
    blue:  'bg-blue-50  text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
  };
  return (
    <div className="card-elevated p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</span>
        <div className={`h-7 w-7 rounded-md ${colorMap[color]} flex items-center justify-center`}>
          <Ico className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="display mono-num !text-2xl">{value}</div>
      {hint && <div className="text-[11px] text-dim mt-1">{hint}</div>}
    </div>
  );
}

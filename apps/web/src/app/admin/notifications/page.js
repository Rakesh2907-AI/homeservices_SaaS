'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import { EmptyState } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const SEVERITY = {
  info:     { ring: 'ring-blue-200',    bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    Ico: Icon.MessageCircle },
  success:  { ring: 'ring-emerald-200', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', Ico: Icon.Check },
  warning:  { ring: 'ring-amber-200',   bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   Ico: Icon.Bolt },
  critical: { ring: 'ring-rose-200',    bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-500',    Ico: Icon.Shield },
};

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  function load() {
    adminFetch('/api/v1/admin/notifications').then((r) => setItems(r.data)).catch((e) => setError(e.message));
  }
  useEffect(load, []);

  const filtered = useMemo(() => {
    if (filter === 'unread') return items.filter((n) => !n.is_read);
    if (filter === 'all') return items;
    return items.filter((n) => n.severity === filter);
  }, [items, filter]);

  const counts = useMemo(() => ({
    all: items.length,
    unread: items.filter((n) => !n.is_read).length,
    info: items.filter((n) => n.severity === 'info').length,
    success: items.filter((n) => n.severity === 'success').length,
    warning: items.filter((n) => n.severity === 'warning').length,
    critical: items.filter((n) => n.severity === 'critical').length,
  }), [items]);

  async function markRead(id) {
    try { await adminFetch(`/api/v1/admin/notifications/${id}/read`, { method: 'PATCH' }); load(); }
    catch (e) { setError(e.message); }
  }
  async function markAllRead() {
    try { await adminFetch('/api/v1/admin/notifications/mark-all-read', { method: 'PATCH' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Operator inbox"
          title="Notifications"
          description="System alerts, billing events, tenant lifecycle changes, and anything else that needs your attention."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Inbox' }]}
          actions={
            counts.unread > 0 && (
              <button onClick={markAllRead} className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:border-gray-400">
                Mark all read ({counts.unread})
              </button>
            )
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="mb-6 flex gap-2 flex-wrap">
        {[
          ['all',      'All'],
          ['unread',   `Unread (${counts.unread})`],
          ['critical', `Critical`],
          ['warning',  `Warning`],
          ['info',     `Info`],
          ['success',  `Success`],
        ].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${filter === key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Icon.MessageCircle} title="No notifications" description="When something happens on the platform that needs your attention, you'll see it here." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => {
            const meta = SEVERITY[n.severity] || SEVERITY.info;
            return (
              <li key={n.id} className={`relative rounded-xl border bg-white p-4 ${!n.is_read ? `${meta.ring} ring-2` : 'border-gray-200'}`}>
                <div className="flex gap-4">
                  <div className={`flex-shrink-0 h-9 w-9 rounded-lg ${meta.bg} ${meta.text} flex items-center justify-center`}>
                    <meta.Ico className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-semibold text-gray-900 truncate">{n.title}</h3>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-blue-500" aria-label="unread" />}
                    </div>
                    {n.body && <p className="text-sm text-gray-600 leading-relaxed">{n.body}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                      {n.business_name && (
                        <Link href={`/admin/tenants/${n.tenant_id}`} className="hover:text-gray-700">on {n.business_name}</Link>
                      )}
                      <code className="font-mono text-[10px] rounded bg-gray-100 px-1.5 py-0.5">{n.type}</code>
                    </div>
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                      Mark read
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminShell>
  );
}

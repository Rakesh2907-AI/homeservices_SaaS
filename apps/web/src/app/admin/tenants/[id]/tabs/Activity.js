'use client';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, Badge, EmptyState, FilterBar, Skeleton } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const ACTION_VARIANT = { CREATE: 'green', UPDATE: 'blue', DELETE: 'red' };

export default function ActivityTab({ tenantId }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tenantId) return;
    adminFetch(`/api/v1/admin/tenants/${tenantId}/activity?limit=200`)
      .then((r) => { setItems(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tenantId]);

  const entityTypes = useMemo(() => {
    const set = new Set(items.map((a) => a.entity_type));
    return ['all', ...Array.from(set).sort()];
  }, [items]);

  const filtered = useMemo(() => filter === 'all' ? items : items.filter((a) => a.entity_type === filter), [items, filter]);

  // Group by date for the timeline-style view
  const grouped = useMemo(() => {
    const buckets = new Map();
    filtered.forEach((a) => {
      const day = new Date(a.created_at).toDateString();
      if (!buckets.has(day)) buckets.set(day, []);
      buckets.get(day).push(a);
    });
    return Array.from(buckets.entries());
  }, [filtered]);

  return (
    <Card padding="none">
      <div className="p-6 pb-4">
        <CardHeader
          title={`Activity feed (${items.length})`}
          description="Every privileged change recorded for this tenant — grouped by day, newest first."
          action={items.length > 0 && (
            <FilterBar
              value={filter}
              onChange={setFilter}
              options={entityTypes.map((e) => ({ value: e, label: e === 'all' ? 'All types' : e }))}
            />
          )}
        />
      </div>
      {loading ? (
        <div className="p-6 pt-0 space-y-3">{[1,2,3,4].map((i) => <Skeleton key={i} height={48} />)}</div>
      ) : grouped.length === 0 ? (
        <div className="p-6 pt-0">
          <EmptyState icon={Icon.Newspaper} title="No activity yet" description="When users or admins make changes, those events are recorded here." />
        </div>
      ) : (
        <div className="border-t border-gray-100">
          {grouped.map(([day, events]) => (
            <div key={day} className="border-b border-gray-100 last:border-0">
              <div className="px-6 py-2 bg-gray-50/50 text-[11px] uppercase tracking-wider font-semibold text-muted">
                {day}
              </div>
              <ul className="divide-y divide-gray-100">
                {events.map((a) => (
                  <li key={a.id} className="px-6 py-3 flex items-start gap-3 text-sm">
                    <div className="flex-shrink-0 mt-0.5">
                      <Badge variant={ACTION_VARIANT[a.action] || 'gray'}>{a.action}</Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-gray-900">{a.entity_type}</span>
                        <code className="font-mono text-[10px] text-dim">{a.entity_id?.slice(0, 8)}…</code>
                        <span className="text-xs text-dim">by</span>
                        <span className="text-xs">{a.actor_email || a.actor_name || <span className="text-dim">system</span>}</span>
                        {a.actor_role && <Badge variant="gray" size="sm">{a.actor_role.replace('_', ' ')}</Badge>}
                      </div>
                      {a.new_value && (
                        <details className="mt-1 group">
                          <summary className="text-[11px] text-muted hover:text-gray-700 cursor-pointer list-none">
                            <span className="group-open:hidden">▸ View payload</span>
                            <span className="hidden group-open:inline">▾ Hide payload</span>
                          </summary>
                          <pre className="mt-2 text-[10px] bg-gray-50 border border-gray-100 rounded p-2 overflow-x-auto font-mono text-gray-700 max-h-40">{JSON.stringify(a.new_value, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                    <span className="text-xs text-dim mono-num flex-shrink-0">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

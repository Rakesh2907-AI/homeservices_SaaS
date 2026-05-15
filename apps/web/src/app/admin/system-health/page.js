'use client';
import { useEffect, useState } from 'react';
import AdminShell, { StatCard } from '@/components/admin/AdminShell';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

function bytes(n) {
  if (n > 1e9) return (n / 1e9).toFixed(2) + ' GB';
  if (n > 1e6) return (n / 1e6).toFixed(1) + ' MB';
  if (n > 1e3) return (n / 1e3).toFixed(1) + ' KB';
  return n + ' B';
}

export default function SystemHealthPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  function load() {
    adminFetch('/api/v1/admin/system-health').then(setData).catch((e) => setError(e.message));
  }

  useEffect(() => {
    load();
    if (!autoRefresh) return;
    const id = setInterval(load, 10000); // poll every 10s
    return () => clearInterval(id);
  }, [autoRefresh]);

  const connectionPct = data ? Math.round((data.postgres.active_connections / data.postgres.max_connections) * 100) : 0;
  const redisOk = data?.redis?.status === 'ok';

  return (
    <AdminShell
      title="System health"
      subtitle="Live state of the platform's infrastructure."
      actions={
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
          Auto-refresh
        </label>
      }
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {!data ? <div className="text-sm text-gray-500">Loading…</div> : (
        <>
          {/* Top tiles */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="DB size"     value={bytes(data.postgres.db_size_bytes)} hint="of homeservices DB" gradient="from-blue-500 to-cyan-500" Ico={Icon.Layers} />
            <StatCard label="Connections" value={`${data.postgres.active_connections} / ${data.postgres.max_connections}`} hint={`${connectionPct}% of pool`} gradient="from-violet-500 to-purple-500" Ico={Icon.Shield} />
            <StatCard label="Redis"       value={redisOk ? `${data.redis.latency_ms} ms` : 'Down'} hint={redisOk ? 'ping latency' : 'service unreachable'} gradient={redisOk ? 'from-emerald-500 to-teal-500' : 'from-rose-500 to-pink-500'} Ico={Icon.Bolt} />
            <StatCard label="API uptime"  value={`${Math.floor(data.runtime.uptime_seconds / 60)} min`} hint={`${data.runtime.memory_mb} MB RAM`} gradient="from-amber-500 to-orange-500" Ico={Icon.Zap} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Postgres */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold mb-1 flex items-center gap-2"><Icon.Layers className="h-4 w-4 text-blue-600" /> PostgreSQL</h2>
              <p className="text-xs text-gray-500 mb-4">{data.postgres.version}</p>
              <Row label="DB size">{bytes(data.postgres.db_size_bytes)}</Row>
              <Row label="Active connections">{data.postgres.active_connections}</Row>
              <Row label="Total connections">{data.postgres.total_connections}</Row>
              <Row label="Max connections">{data.postgres.max_connections}</Row>
              <div className="mt-4">
                <div className="text-xs text-gray-500 mb-1">Connection pool</div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full ${connectionPct > 80 ? 'bg-rose-500' : connectionPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.max(connectionPct, 2)}%` }} />
                </div>
              </div>
            </div>

            {/* Runtime */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold mb-1 flex items-center gap-2"><Icon.Code className="h-4 w-4 text-violet-600" /> Node.js runtime</h2>
              <p className="text-xs text-gray-500 mb-4">tenant-service introspection</p>
              <Row label="Version"><code className="font-mono text-xs">{data.runtime.node_version}</code></Row>
              <Row label="Environment"><code className="font-mono text-xs">{data.runtime.env}</code></Row>
              <Row label="Uptime">{data.runtime.uptime_seconds}s</Row>
              <Row label="RSS memory">{data.runtime.memory_mb} MB</Row>
              <Row label="Response time">{data.response_time_ms} ms</Row>
              <Row label="Last checked">{new Date(data.checked_at).toLocaleTimeString()}</Row>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top tables */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold">Largest tables</h2>
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {data.top_tables.map((t) => (
                    <tr key={t.table}>
                      <td className="px-6 py-2.5 font-mono text-xs">{t.table}</td>
                      <td className="px-6 py-2.5 text-right text-gray-600">{bytes(t.bytes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recent migrations */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold">Recent migrations</h2>
              </div>
              <ul className="divide-y divide-gray-100">
                {data.recent_migrations.map((m) => (
                  <li key={m.name} className="px-6 py-2.5">
                    <div className="text-sm font-mono">{m.name}</div>
                    <div className="text-xs text-gray-500">batch {m.batch} · {new Date(m.migration_time).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </AdminShell>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{children}</span>
    </div>
  );
}

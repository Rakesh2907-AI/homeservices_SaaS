'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, getSession, clearSession } from '@/lib/api';
import { applyThemeVars } from '@/components/WizardShell';

export default function Dashboard() {
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [stats, setStats] = useState({ categories: 0, services: 0, bookings: 0, commissions: 0 });
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!getSession().token) { router.push('/login'); return; }

    api.onboardingStatus().then((t) => {
      setTenant(t);
      applyThemeVars(t?.theme_config);
    });

    Promise.all([
      api.listCategories().catch(() => ({ data: [] })),
      api.listServices().catch(() => ({ data: [] })),
      api.listBookings().catch(() => ({ data: [] })),
      api.listCommissions().catch(() => ({ data: [] })),
    ]).then(([cats, svcs, bks, coms]) => {
      setStats({
        categories: cats.data.length,
        services: svcs.data.length,
        bookings: bks.data.length,
        commissions: coms.data.length,
      });
      setRecentBookings(bks.data.slice(0, 5));
    });
  }, [router]);

  function logout() {
    clearSession();
    router.push('/');
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-bg)' }}>
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logo_url
              ? <img src={tenant.logo_url} alt="logo" className="h-8" />
              : <div className="h-8 w-8 rounded" style={{ background: 'var(--brand-primary)' }} />}
            <span className="font-semibold">{tenant?.business_name || 'Dashboard'}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Plan: <strong className="capitalize">{tenant?.plan_tier}</strong>
            </span>
            <button onClick={logout} className="text-sm text-gray-600 hover:text-gray-900">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back{tenant?.business_name ? `, ${tenant.business_name}` : ''}</h1>
        <p className="text-gray-600 mb-8">Here&apos;s what&apos;s happening today.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            ['Categories', stats.categories],
            ['Services', stats.services],
            ['Bookings', stats.bookings],
            ['Commission rules', stats.commissions],
          ].map(([label, value]) => (
            <div key={label} className="card">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="text-3xl font-bold mt-1" style={{ color: 'var(--brand-primary)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ActionCard title="Edit theme & branding" desc="Change colors, logo, fonts." onClick={() => router.push('/onboarding/theme')} />
          <ActionCard title="Manage categories" desc="Add or organize service categories." onClick={() => router.push('/onboarding/categories')} />
          <ActionCard title="Manage services & pricing" desc="Update offerings, rates, durations." onClick={() => router.push('/onboarding/services')} />
        </div>

        {/* Recent bookings */}
        <div className="card">
          <h2 className="font-semibold text-lg mb-4">Recent bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500">No bookings yet. They&apos;ll appear here as customers book.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2">Scheduled</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((b) => (
                  <tr key={b.id} className="border-b">
                    <td className="py-2">{new Date(b.scheduled_at).toLocaleString()}</td>
                    <td className="py-2 capitalize">{b.status}</td>
                    <td className="py-2">${b.quoted_price ?? '—'}</td>
                    <td className="py-2 text-gray-600">{b.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function ActionCard({ title, desc, onClick }) {
  return (
    <button onClick={onClick} className="card text-left hover:shadow-md transition">
      <h3 className="font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-600">{desc}</p>
    </button>
  );
}

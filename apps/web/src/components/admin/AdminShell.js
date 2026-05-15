'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';
import { getAdminToken, getAdminUser, clearAdminSession } from '@/lib/admin-api';

const NAV = [
  { type: 'item',  href: '/admin',                       label: 'Overview',         Ico: Icon.Chart },
  { type: 'group', label: 'Platform' },
  { type: 'item',  href: '/admin/tenants',               label: 'Tenants',          Ico: Icon.Globe },
  { type: 'item',  href: '/admin/users',                 label: 'Users',            Ico: Icon.Shield },
  { type: 'item',  href: '/admin/bookings',              label: 'Bookings',         Ico: Icon.Calendar },
  { type: 'item',  href: '/admin/system-health',         label: 'System health',    Ico: Icon.Bolt },
  { type: 'item',  href: '/admin/announcements',         label: 'Announcements',    Ico: Icon.MessageCircle },
  { type: 'item',  href: '/admin/email-templates',       label: 'Email templates',  Ico: Icon.Mail },
  { type: 'item',  href: '/admin/themes',                label: 'Themes',           Ico: Icon.Palette },
  { type: 'item',  href: '/admin/api-keys',              label: 'API keys',         Ico: Icon.Code },
  { type: 'item',  href: '/admin/webhooks',              label: 'Webhooks',         Ico: Icon.Zap },
  { type: 'group', label: 'Content' },
  { type: 'item',  href: '/admin/blog',                  label: 'Blog',             Ico: Icon.Newspaper },
  { type: 'item',  href: '/admin/changelog',             label: 'Changelog',        Ico: Icon.Layers },
  { type: 'item',  href: '/admin/category-templates',    label: 'Category library', Ico: Icon.Layers },
  { type: 'item',  href: '/admin/service-templates',     label: 'Service library',  Ico: Icon.Bolt },
  { type: 'group', label: 'Configuration' },
  { type: 'item',  href: '/admin/plans',                 label: 'Plans',            Ico: Icon.Dollar },
  { type: 'item',  href: '/admin/feature-flags',         label: 'Feature flags',    Ico: Icon.Bolt },
  { type: 'item',  href: '/admin/audit-logs',            label: 'Audit logs',       Ico: Icon.Newspaper },
  { type: 'item',  href: '/admin/settings',              label: 'Settings',         Ico: Icon.Lock },
];

/**
 * Wraps every admin page. Handles auth gate, sidebar, top bar, and content area.
 *
 * Usage:
 *   <AdminShell title="Tenants" subtitle="All businesses on the platform">
 *     ...page content...
 *   </AdminShell>
 */
export default function AdminShell({ title, subtitle, actions, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin/login'); return; }
    setUser(getAdminUser());
    setReady(true);
  }, [router]);

  function logout() {
    clearAdminSession();
    router.push('/admin/login');
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* ===== Sidebar (desktop) ===== */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-gray-900 text-gray-200 border-r border-gray-800">
        <Link href="/admin" className="flex items-center gap-2 px-6 h-16 border-b border-gray-800">
          <span className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400" />
          <div className="leading-tight">
            <div className="font-semibold text-white">ServiceHub</div>
            <div className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Admin Console</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {NAV.map((item, idx) => {
            if (item.type === 'group') {
              return (
                <div key={`g-${idx}`} className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider font-bold text-gray-500">
                  {item.label}
                </div>
              );
            }
            const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  active
                    ? 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 text-white border border-cyan-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
                }`}
              >
                <item.Ico className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-semibold text-white text-sm">
              {(user?.full_name || user?.email || '?').split(' ').map((n) => n[0]).slice(0, 2).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-white truncate">{user?.full_name}</div>
              <div className="text-xs text-gray-500 truncate">{user?.email}</div>
            </div>
          </div>
          <button onClick={logout} className="w-full text-xs rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white py-1.5 transition">
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== Mobile top bar (mobile only) ===== */}
      <div className="lg:hidden sticky top-0 z-20 bg-gray-900 text-white border-b border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400" />
            <span className="font-semibold">Admin</span>
          </div>
          <button onClick={() => setNavOpen((o) => !o)} className="p-2" aria-label="menu">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={navOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {navOpen && (
          <nav className="border-t border-gray-800 p-3 space-y-0.5">
            {NAV.map((item, idx) => {
              if (item.type === 'group') {
                return <div key={`g-${idx}`} className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider font-bold text-gray-500">{item.label}</div>;
              }
              const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${active ? 'bg-cyan-500/20 text-white' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  <item.Ico className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <button onClick={logout} className="w-full text-left px-3 py-2 mt-2 rounded-md text-sm text-rose-400 hover:bg-gray-800">Sign out</button>
          </nav>
        )}
      </div>

      {/* ===== Main content ===== */}
      <main className="lg:pl-64">
        <header className="bg-white border-b border-gray-200 px-6 lg:px-10 py-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>

        <div className="px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

/* Reusable stat card */
export function StatCard({ label, value, hint, gradient = 'from-blue-500 to-cyan-500', Ico }) {
  return (
    <div className="relative rounded-xl border border-gray-200 bg-white p-5 overflow-hidden">
      <div aria-hidden className={`absolute -top-10 -right-10 h-24 w-24 rounded-full bg-gradient-to-br ${gradient} opacity-15 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</div>
          <div className="text-3xl font-bold mt-1">{value}</div>
          {hint && <div className="text-xs text-gray-500 mt-1">{hint}</div>}
        </div>
        {Ico && (
          <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center`}>
            <Ico className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';
import { getAdminToken, getAdminUser, clearAdminSession, adminFetch } from '@/lib/admin-api';

/* ============================================================
 * SIDEBAR NAV CONFIG
 * ============================================================ */
const NAV = [
  { type: 'item',  href: '/admin',                       label: 'Overview',         Ico: Icon.Chart },
  { type: 'item',  href: '/admin/notifications',         label: 'Inbox',            Ico: Icon.MessageCircle, badge: 'unread' },
  { type: 'group', label: 'Tenants' },
  { type: 'item',  href: '/admin/tenants',               label: 'Tenants',          Ico: Icon.Globe },
  { type: 'item',  href: '/admin/bookings',              label: 'Bookings',         Ico: Icon.Calendar },
  { type: 'group', label: 'Revenue & Billing' },
  { type: 'item',  href: '/admin/revenue',               label: 'Revenue',          Ico: Icon.Chart },
  { type: 'item',  href: '/admin/subscriptions',         label: 'Subscriptions',    Ico: Icon.Dollar },
  { type: 'item',  href: '/admin/invoices',              label: 'Invoices',         Ico: Icon.Newspaper },
  { type: 'item',  href: '/admin/taxes',                 label: 'Tax rates',        Ico: Icon.Layers },
  { type: 'item',  href: '/admin/discounts',             label: 'Discounts',        Ico: Icon.Star },
  { type: 'item',  href: '/admin/plans',                 label: 'Plans',            Ico: Icon.Dollar },
  { type: 'group', label: 'Platform' },
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
  { type: 'item',  href: '/admin/feature-flags',         label: 'Feature flags',    Ico: Icon.Bolt },
  { type: 'item',  href: '/admin/audit-logs',            label: 'Audit logs',       Ico: Icon.Newspaper },
  { type: 'item',  href: '/admin/settings',              label: 'Settings',         Ico: Icon.Lock },
];

/* ============================================================
 * ADMIN SHELL
 *
 * Layout:
 *   ┌─────────────┬───────────────────────────────────────────┐
 *   │             │  TOPBAR (search, bell, user)              │
 *   │             ├───────────────────────────────────────────┤
 *   │  SIDEBAR    │  PAGE HEADER (via `header` prop or title) │
 *   │  (dark)     ├───────────────────────────────────────────┤
 *   │             │                                           │
 *   │             │  CONTENT                                  │
 *   │             │                                           │
 *   └─────────────┴───────────────────────────────────────────┘
 * ============================================================ */
export default function AdminShell({ title, subtitle, actions, header, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!getAdminToken()) { router.push('/admin/login'); return; }
    setUser(getAdminUser());
    setReady(true);
    adminFetch('/api/v1/admin/notifications/unread-count').then((r) => setUnread(r.count)).catch(() => {});
  }, [router]);

  useEffect(() => {
    function close(e) { if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false); }
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  function logout() {
    clearAdminSession();
    router.push('/admin/login');
  }

  if (!ready) {
    return (
      <div className="admin-app min-h-screen flex items-center justify-center">
        <div className="text-sm text-muted">Loading…</div>
      </div>
    );
  }

  const initials = (user?.full_name || user?.email || '?').split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();

  return (
    <div className="admin-app min-h-screen">
      {/* ===== Sidebar (desktop) ===== */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 w-[248px] flex-col text-[var(--text-on-dark)]"
        style={{ background: 'var(--surface-sidebar)' }}
      >
        {/* Brand */}
        <Link href="/admin" className="flex items-center gap-2.5 px-5 h-[60px] border-b" style={{ borderColor: 'var(--border-sidebar)' }}>
          <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-white">ServiceHub</div>
            <div className="text-[10px] uppercase tracking-[0.12em] font-semibold" style={{ color: '#7dd3fc' }}>Admin Console</div>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-px">
          {NAV.map((item, idx) => {
            if (item.type === 'group') {
              return (
                <div key={`g-${idx}`} className="px-2.5 pt-4 pb-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold" style={{ color: 'var(--text-on-dark-muted)' }}>
                  {item.label}
                </div>
              );
            }
            const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
            const badgeValue = item.badge === 'unread' ? unread : null;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all relative ${
                  active ? 'text-white' : 'text-gray-400 hover:text-gray-100 hover:bg-white/[0.04]'
                }`}
                style={active ? { background: 'rgba(56, 189, 248, 0.12)' } : undefined}
              >
                {active && <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-cyan-400" />}
                <item.Ico className={`h-[15px] w-[15px] flex-shrink-0 ${active ? 'text-cyan-300' : 'text-gray-500 group-hover:text-gray-300'}`} />
                <span className="flex-1 font-medium tracking-[-0.005em]">{item.label}</span>
                {badgeValue > 0 && (
                  <span className="rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 leading-none mono-num">{badgeValue > 99 ? '99+' : badgeValue}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer: support + version */}
        <div className="px-3 pb-3 pt-2 border-t" style={{ borderColor: 'var(--border-sidebar)' }}>
          <a href="/support" className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[12px] text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] transition">
            <Icon.MessageCircle className="h-[14px] w-[14px]" />
            <span>Help & support</span>
          </a>
          <div className="px-2.5 pt-1 text-[10px] text-gray-600">v2.4.0 · main</div>
        </div>
      </aside>

      {/* ===== Mobile top bar (mobile only) ===== */}
      <div className="lg:hidden sticky top-0 z-30 text-white border-b" style={{ background: 'var(--surface-sidebar)', borderColor: 'var(--border-sidebar)' }}>
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-400" />
            <span className="font-semibold text-sm">ServiceHub Admin</span>
          </div>
          <button onClick={() => setNavOpen((o) => !o)} className="p-2" aria-label="menu">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={navOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </div>
        {navOpen && (
          <nav className="border-t p-3 space-y-px" style={{ borderColor: 'var(--border-sidebar)' }}>
            {NAV.map((item, idx) => {
              if (item.type === 'group') {
                return <div key={`g-${idx}`} className="px-2.5 pt-3 pb-1 text-[10px] uppercase tracking-wider font-semibold text-gray-500">{item.label}</div>;
              }
              const active = item.href === '/admin' ? pathname === '/admin' : pathname === item.href || pathname.startsWith(item.href + '/');
              const badgeValue = item.badge === 'unread' ? unread : null;
              return (
                <Link
                  key={item.href} href={item.href} onClick={() => setNavOpen(false)}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm ${active ? 'bg-cyan-500/15 text-white' : 'text-gray-300 hover:bg-white/[0.04]'}`}
                >
                  <item.Ico className="h-4 w-4" />
                  <span className="flex-1">{item.label}</span>
                  {badgeValue > 0 && <span className="rounded-full bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5">{badgeValue}</span>}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* ===== Main content ===== */}
      <main className="lg:pl-[248px]">
        {/* Top bar: search + notif + user menu */}
        <div className="h-[60px] border-b bg-white/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6 lg:px-10" style={{ borderColor: 'var(--border-subtle)' }}>
          {/* Left: search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="search"
                placeholder="Search tenants, users, invoices…"
                className="w-full rounded-md border-0 bg-gray-100/70 hover:bg-gray-100 focus:bg-white focus:ring-1 focus:ring-blue-500 transition pl-9 pr-12 py-1.5 text-sm placeholder:text-gray-400 outline-none"
              />
              <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] rounded border border-gray-200 bg-white px-1.5 py-0.5 font-mono text-gray-500">⌘K</kbd>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2">
            <Link href="/admin/notifications" className="relative rounded-md p-2 hover:bg-gray-100 transition" aria-label="Notifications">
              <svg className="h-[18px] w-[18px] text-gray-600" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unread > 0 && <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
            </Link>

            <div className="h-5 w-px bg-gray-200 mx-1" />

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-gray-100 transition"
              >
                <div className="h-7 w-7 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-semibold">
                  {initials}
                </div>
                <span className="hidden md:inline text-sm font-medium text-gray-700 max-w-[140px] truncate">{user?.full_name?.split(' ')[0] || 'Admin'}</span>
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
                </svg>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-64 card-elevated p-1 z-30">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate">{user?.full_name}</div>
                    <div className="text-xs text-muted truncate">{user?.email}</div>
                    <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-700 bg-rose-50 ring-1 ring-rose-200 rounded-full px-1.5 py-0.5">
                      Super admin
                    </div>
                  </div>
                  <Link href="/admin/settings" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                    <Icon.Lock className="h-3.5 w-3.5 text-gray-500" /> Account settings
                  </Link>
                  <Link href="/admin/audit-logs" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                    <Icon.Newspaper className="h-3.5 w-3.5 text-gray-500" /> Audit log
                  </Link>
                  <Link href="/" target="_blank" className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100">
                    <Icon.Globe className="h-3.5 w-3.5 text-gray-500" /> Marketing site
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-rose-600 rounded-md hover:bg-rose-50">
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page header */}
        {header ? (
          header
        ) : (
          <header className="border-b bg-white px-6 lg:px-10 pt-8 pb-7 flex flex-wrap items-start justify-between gap-4" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex-1 min-w-0">
              <h1 className="display">{title}</h1>
              {subtitle && <p className="mt-2 text-[15px] text-muted max-w-3xl leading-relaxed">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
          </header>
        )}

        {/* Content */}
        <div className="px-6 lg:px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

/* Backwards-compat: pages that import StatCard still get a working one. */
export function StatCard({ label, value, hint, gradient = 'from-blue-500 to-cyan-500', Ico }) {
  return (
    <div className="card-elevated p-5 relative overflow-hidden">
      <div aria-hidden className={`absolute -top-8 -right-8 h-20 w-20 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</div>
          <div className="display mono-num !text-2xl mt-2">{value}</div>
          {hint && <div className="text-xs text-dim mt-1.5">{hint}</div>}
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

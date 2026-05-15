'use client';
import Link from 'next/link';

/**
 * Wraps customer-facing portal pages with the tenant's branding. Tenant
 * is passed in (already fetched by the page). Theme is applied via CSS
 * variables set on <html> by the page itself.
 */
export default function PortalShell({ tenant, slug, children }) {
  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--brand-bg)', color: 'var(--brand-text)' }}>
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={`/p/${slug}`} className="flex items-center gap-3 font-semibold">
            {tenant.logo_url
              ? <img src={tenant.logo_url} alt={tenant.business_name} className="h-9 max-w-[160px] object-contain" />
              : <span className="h-9 w-9 rounded-md" style={{ background: 'var(--brand-primary)' }} />}
            <span>{tenant.business_name}</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/p/${slug}/services`} className="hover:opacity-70">Services</Link>
            <a href={`tel:${tenant.business_details?.phone || ''}`} className="hidden sm:inline hover:opacity-70">
              {tenant.business_details?.phone || ''}
            </a>
            <Link href={`/p/${slug}/services`} className="rounded-md px-4 py-2 text-sm font-medium text-white" style={{ background: 'var(--brand-primary)' }}>
              Book now
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-200 bg-white/80 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="font-semibold mb-2">{tenant.business_name}</div>
            <p className="text-gray-600">{tenant.business_details?.description || 'Professional home services.'}</p>
          </div>
          <div className="text-gray-700 space-y-1">
            {tenant.business_details?.phone && <div>📞 {tenant.business_details.phone}</div>}
            {tenant.business_details?.email && <div>✉️ {tenant.business_details.email}</div>}
            {tenant.business_details?.website && <a href={tenant.business_details.website} className="hover:opacity-70 block">🌐 {tenant.business_details.website}</a>}
          </div>
          <div className="text-gray-600 text-xs md:text-right">
            <p>Powered by <span className="font-semibold">ServiceHub</span></p>
            <p className="mt-1">© {new Date().getFullYear()} {tenant.business_name}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

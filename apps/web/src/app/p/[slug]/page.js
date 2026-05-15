'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import { portal, applyTenantTheme } from '@/lib/portal-api';

export default function PortalHome() {
  const { slug } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!slug) return;
    portal.getTenant(slug).then((t) => {
      setTenant(t);
      applyTenantTheme(t.theme_config);
    }).catch((e) => setError(e.message));
    portal.getCategories(slug).then((r) => setCategories(r.data)).catch(() => {});
    portal.getServices(slug).then((r) => setServices(r.data.slice(0, 6))).catch(() => {});
  }, [slug]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business not found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">← Back to ServiceHub</Link>
        </div>
      </div>
    );
  }

  const parents = categories.filter((c) => !c.parent_category_id);

  return (
    <PortalShell tenant={tenant} slug={slug}>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10 opacity-50">
          <div className="absolute top-0 right-0 h-96 w-96 rounded-full blur-3xl" style={{ background: 'var(--brand-primary)', opacity: 0.18 }} />
          <div className="absolute top-32 left-12 h-72 w-72 rounded-full blur-3xl" style={{ background: 'var(--brand-secondary)', opacity: 0.15 }} />
        </div>
        <div className="max-w-6xl mx-auto px-6 py-20 md:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              {tenant?.business_name || 'Welcome'}
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-600 max-w-2xl">
              {tenant?.business_details?.description || 'Professional home services, booked in seconds.'}
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href={`/p/${slug}/services`} className="inline-flex items-center justify-center rounded-md px-6 py-3 font-medium text-white text-base shadow-lg" style={{ background: 'var(--brand-primary)' }}>
                Browse services →
              </Link>
              {tenant?.business_details?.phone && (
                <a href={`tel:${tenant.business_details.phone}`} className="inline-flex items-center justify-center rounded-md border-2 px-6 py-3 font-medium" style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-primary)' }}>
                  Call {tenant.business_details.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {parents.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-2xl font-bold mb-6">Service categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {parents.map((c) => (
              <Link key={c.id} href={`/p/${slug}/services?category=${c.id}`} className="rounded-xl border border-gray-200 p-5 bg-white hover:shadow-md transition group">
                <div className="h-12 w-12 rounded-lg flex items-center justify-center mb-3" style={{ background: 'var(--brand-primary)', opacity: 0.15 }}>
                  <span className="text-2xl" style={{ color: 'var(--brand-primary)' }}>★</span>
                </div>
                <h3 className="font-semibold group-hover:opacity-80">{c.name}</h3>
                {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured services */}
      {services.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Popular services</h2>
            <Link href={`/p/${slug}/services`} className="text-sm font-medium hover:opacity-70" style={{ color: 'var(--brand-primary)' }}>View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link key={s.id} href={`/p/${slug}/book/${s.id}`} className="rounded-xl bg-white border border-gray-200 p-5 hover:shadow-md transition">
                <h3 className="font-semibold mb-1">{s.title}</h3>
                {s.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{s.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{s.duration_mins ? `${s.duration_mins} min` : 'Custom'}</span>
                  {s.base_price && <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>From ${parseFloat(s.base_price).toFixed(0)}</span>}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          ['⚡ Same-day booking', 'Most appointments available within 24 hours.'],
          ['💳 Secure payment', 'Pay online or after service — your choice.'],
          ['⭐ Guaranteed quality', 'Background-checked technicians. 100% satisfaction.'],
        ].map(([t, d]) => (
          <div key={t} className="rounded-lg bg-white border border-gray-200 p-5">
            <h3 className="font-semibold mb-1">{t}</h3>
            <p className="text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </section>
    </PortalShell>
  );
}

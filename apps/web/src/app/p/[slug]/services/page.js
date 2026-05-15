'use client';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import { portal, applyTenantTheme } from '@/lib/portal-api';

export default function ServicesIndex() {
  const { slug } = useParams();
  const search = useSearchParams();
  const initialCategory = search.get('category') || '';
  const [tenant, setTenant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    if (!slug) return;
    portal.getTenant(slug).then((t) => { setTenant(t); applyTenantTheme(t.theme_config); });
    portal.getCategories(slug).then((r) => setCategories(r.data));
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    portal.getServices(slug, activeCategory).then((r) => setServices(r.data));
  }, [slug, activeCategory]);

  const parents = useMemo(() => categories.filter((c) => !c.parent_category_id), [categories]);
  const childrenByParent = useMemo(() => {
    const m = {};
    categories.filter((c) => c.parent_category_id).forEach((c) => { (m[c.parent_category_id] ||= []).push(c); });
    return m;
  }, [categories]);

  return (
    <PortalShell tenant={tenant} slug={slug}>
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Services</h1>
        <p className="text-gray-600 mb-8">Pick a category, then book a time.</p>

        {/* Category pills */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          <button
            onClick={() => setActiveCategory('')}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${!activeCategory ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            style={!activeCategory ? { background: 'var(--brand-primary)' } : undefined}
          >
            All
          </button>
          {parents.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${activeCategory === c.id ? 'text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              style={activeCategory === c.id ? { background: 'var(--brand-primary)' } : undefined}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* Sub-categories chips when a parent is active */}
        {activeCategory && childrenByParent[activeCategory]?.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {childrenByParent[activeCategory].map((sub) => (
              <button
                key={sub.id}
                onClick={() => setActiveCategory(sub.id)}
                className="rounded-full border px-3 py-1 text-xs text-gray-700 hover:border-gray-400"
              >
                ↳ {sub.name}
              </button>
            ))}
          </div>
        )}

        {/* Services grid */}
        {services.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-sm text-gray-500">
            No services in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <Link key={s.id} href={`/p/${slug}/book/${s.id}`} className="rounded-xl bg-white border border-gray-200 p-5 hover:shadow-md transition flex flex-col">
                <h3 className="font-semibold mb-1">{s.title}</h3>
                {s.description && <p className="text-sm text-gray-600 mb-3 line-clamp-3 flex-1">{s.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">{s.duration_mins ? `${s.duration_mins} min` : 'Custom'}</span>
                  {s.base_price && <span className="font-bold" style={{ color: 'var(--brand-primary)' }}>From ${parseFloat(s.base_price).toFixed(0)}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PortalShell>
  );
}

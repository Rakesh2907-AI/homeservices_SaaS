import Link from 'next/link';

/**
 * Stripe/Linear-style page header. Renders:
 *   breadcrumbs (small, muted)
 *   eyebrow + display title
 *   description
 *   actions  (right-aligned)
 *   tabs     (bottom row, with active underline)
 */
export default function PageHeader({ eyebrow, title, description, breadcrumbs, actions, tabs }) {
  return (
    <div className="border-b bg-white" style={{ borderColor: 'var(--border-subtle)' }}>
      <div className="px-6 lg:px-10 pt-7 pb-6">
        {breadcrumbs?.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-2.5 flex items-center gap-1.5 text-[12px] text-gray-500">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.href ? (
                  <Link href={b.href} className="hover:text-gray-900 transition">{b.label}</Link>
                ) : (
                  <span className="text-gray-700 font-medium">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="text-gray-300 select-none">/</span>}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
            <h1 className="display">{title}</h1>
            {description && (
              <p className="mt-2.5 text-[15px] text-muted max-w-3xl leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>
      </div>

      {tabs?.length > 0 && (
        <div className="px-6 lg:px-10 -mt-px overflow-x-auto">
          <div className="flex items-center gap-0">
            {tabs.map((t, i) => {
              const className = `relative px-3 py-3 text-[13px] font-medium whitespace-nowrap transition-colors ${
                t.active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`;
              const inner = (
                <>
                  <span className="flex items-center gap-1.5">
                    {t.label}
                    {t.count != null && (
                      <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold mono-num ${t.active ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                        {t.count}
                      </span>
                    )}
                  </span>
                  {t.active && <span aria-hidden className="absolute left-3 right-3 -bottom-px h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                </>
              );
              // In-page tabs with onClick render as buttons; navigation tabs render as links.
              if (t.onClick) {
                return <button key={i} type="button" onClick={t.onClick} className={className}>{inner}</button>;
              }
              return <Link key={t.href || i} href={t.href} className={className}>{inner}</Link>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

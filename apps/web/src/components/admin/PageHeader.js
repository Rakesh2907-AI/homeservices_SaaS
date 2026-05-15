import Link from 'next/link';

/**
 * Replaces the old AdminShell header. Adds eyebrow/breadcrumbs, a description
 * line, optional KPI strip, and a tab bar — common shape across most admin
 * pages so they feel cohesive.
 *
 * Props:
 *  - eyebrow:      small uppercase label above title (e.g. "Platform")
 *  - title:        bold page title
 *  - description:  one-line, more descriptive than the old subtitle
 *  - breadcrumbs:  [{ label, href? }] — last item is the current page
 *  - actions:      buttons/links rendered top-right
 *  - kpis:         optional [{ label, value, hint?, trend? }] strip below header
 *  - tabs:         optional [{ label, href, active?, count? }] bar below KPIs
 */
export default function PageHeader({ eyebrow, title, description, breadcrumbs, actions, kpis, tabs }) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        {breadcrumbs?.length > 0 && (
          <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {b.href ? (
                  <Link href={b.href} className="hover:text-gray-900 transition">{b.label}</Link>
                ) : (
                  <span className="text-gray-700">{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-blue-600 mb-1.5">{eyebrow}</p>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
            {description && (
              <p className="mt-2 text-base text-gray-600 max-w-3xl leading-relaxed">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </div>

        {kpis?.length > 0 && (
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((k, i) => <InlineKpi key={i} {...k} />)}
          </div>
        )}
      </div>

      {tabs?.length > 0 && (
        <div className="px-6 lg:px-10 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`relative px-3 py-3 text-sm font-medium whitespace-nowrap transition ${
                t.active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <span className="flex items-center gap-2">
                {t.label}
                {t.count != null && (
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-semibold ${t.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {t.count}
                  </span>
                )}
              </span>
              {t.active && <span aria-hidden className="absolute left-3 right-3 -bottom-px h-0.5 bg-gradient-to-r from-blue-500 to-cyan-500" />}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function InlineKpi({ label, value, hint, trend }) {
  const trendColor =
    trend == null ? '' :
    trend > 0 ? 'text-emerald-600' :
    trend < 0 ? 'text-rose-600' : 'text-gray-500';

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-gray-900">{value}</span>
        {trend != null && (
          <span className={`text-xs font-medium ${trendColor}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-gray-500">{hint}</div>}
    </div>
  );
}

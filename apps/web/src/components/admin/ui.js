/**
 * Shared admin UI primitives — kept in one file because none of them is
 * complex enough to deserve its own.
 */
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';

/** Hero KPI card used on dashboards. Big number + trend chip + optional spark. */
export function KpiCard({ label, value, hint, trend, Ico, gradient = 'from-blue-500 to-cyan-500' }) {
  const trendColor =
    trend == null ? 'text-gray-500' :
    trend > 0 ? 'text-emerald-600 bg-emerald-50' :
    trend < 0 ? 'text-rose-600 bg-rose-50' : 'text-gray-500 bg-gray-50';

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-white p-5 overflow-hidden">
      <div aria-hidden className={`absolute -top-10 -right-10 h-28 w-28 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-2xl`} />
      <div className="relative">
        <div className="flex items-start justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">{label}</p>
          {Ico && (
            <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-sm`}>
              <Ico className="h-4 w-4" />
            </div>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-gray-900">{value}</span>
          {trend != null && (
            <span className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 ${trendColor}`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}

/** Compact section header for groupings inside a page. */
export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-blue-600 mb-1">{eyebrow}</p>}
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-600 max-w-2xl">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/** Empty state with icon, title, helpful description, and a primary action. */
export function EmptyState({ icon: Ico = Icon.Layers, title, description, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center mb-4">
        <Ico className="h-7 w-7 text-blue-600" />
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-gray-600 max-w-md mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Standard badge / pill — consistent across the admin. */
export function Badge({ children, variant = 'gray', size = 'sm' }) {
  const variants = {
    gray:    'bg-gray-100 text-gray-700',
    blue:    'bg-blue-50 text-blue-700',
    green:   'bg-emerald-50 text-emerald-700',
    amber:   'bg-amber-50 text-amber-700',
    red:     'bg-rose-50 text-rose-700',
    violet:  'bg-violet-50 text-violet-700',
    indigo:  'bg-indigo-50 text-indigo-700',
    cyan:    'bg-cyan-50 text-cyan-700',
  };
  const sizes = { sm: 'text-[11px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' };
  return <span className={`inline-flex items-center gap-1 rounded-full font-medium ${variants[variant] || variants.gray} ${sizes[size]}`}>{children}</span>;
}

/** Status dot + label, e.g. "● Active". Tailwind needs the full class names to JIT, so we enumerate. */
const DOT_COLORS = {
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  rose:    'bg-rose-500',
  blue:    'bg-blue-500',
  gray:    'bg-gray-400',
  violet:  'bg-violet-500',
};
export function StatusDot({ color = 'emerald', label, pulse = false }) {
  const dotClass = DOT_COLORS[color] || DOT_COLORS.emerald;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-gray-700">
      <span className="relative flex h-2 w-2">
        {pulse && <span className={`absolute inline-flex h-full w-full rounded-full ${dotClass} opacity-60 animate-ping`} />}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      </span>
      {label}
    </span>
  );
}

/** Standard card wrapper. */
export function Card({ children, className = '', padding = 'normal' }) {
  const padMap = { none: '', tight: 'p-4', normal: 'p-6', loose: 'p-8' };
  return <div className={`rounded-2xl border border-gray-200 bg-white ${padMap[padding]} ${className}`}>{children}</div>;
}

/** Helper for currency formatting throughout the admin. */
export function money(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format((cents || 0) / 100);
}

/**
 * Admin UI primitives. Designed to feel coherent across pages — Linear/Stripe
 * /Vercel-grade typography and spacing. All consumers should reach for these
 * before reaching for raw Tailwind.
 */
import Link from 'next/link';
import { Icon } from '@/components/marketing/icons';

/* ============================================================
 * BUTTON
 * ============================================================ */
const BUTTON_VARIANTS = {
  primary:    'bg-gray-900 text-white hover:bg-gray-800 shadow-sm border border-gray-900',
  secondary:  'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-gray-400 shadow-sm',
  ghost:      'text-gray-700 hover:bg-gray-100 border border-transparent',
  destructive:'bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-rose-600',
  accent:     'text-white bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-sm border border-blue-600',
};
const BUTTON_SIZES = {
  xs: 'text-xs px-2.5 py-1 rounded-md gap-1',
  sm: 'text-sm px-3 py-1.5 rounded-md gap-1.5',
  md: 'text-sm px-4 py-2 rounded-md gap-2',
  lg: 'text-sm px-5 py-2.5 rounded-lg gap-2',
};
export function Button({ as: As = 'button', variant = 'secondary', size = 'md', className = '', children, href, ...rest }) {
  const cls = `inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`;
  if (href) {
    return <Link className={cls} href={href} {...rest}>{children}</Link>;
  }
  return <As className={cls} {...rest}>{children}</As>;
}

/* ============================================================
 * CARD
 * ============================================================ */
export function Card({ children, className = '', elevated = true, padding = 'md' }) {
  const padMap = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' };
  return (
    <div className={`${elevated ? 'card-elevated' : 'card-flat'} ${padMap[padding]} ${className}`}>
      {children}
    </div>
  );
}
export function CardHeader({ title, description, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="min-w-0">
        <h3 className="h2">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ============================================================
 * KPI CARD
 * ============================================================ */
const ACCENTS = {
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-600' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-600' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-600' },
  violet:  { bg: 'bg-violet-50',  text: 'text-violet-600' },
  cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600' },
  gray:    { bg: 'bg-gray-100',   text: 'text-gray-700' },
};
export function KpiCard({ label, value, hint, trend, Ico, accent = 'blue', loading = false }) {
  const accentBg = ACCENTS[accent] || ACCENTS.blue;
  const trendStyle =
    trend == null ? '' :
    trend > 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
    trend < 0 ? 'text-rose-700 bg-rose-50 border-rose-100' :
                'text-gray-600 bg-gray-50 border-gray-100';
  return (
    <div className="card-elevated p-5 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</p>
          <div className="mt-2 flex items-baseline gap-2">
            {loading ? (
              <div className="skeleton h-7 w-24" />
            ) : (
              <>
                <span className="display mono-num !text-2xl">{value}</span>
                {trend != null && (
                  <span className={`text-[11px] font-semibold rounded-full px-1.5 py-0.5 border ${trendStyle}`}>
                    {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
                  </span>
                )}
              </>
            )}
          </div>
          {hint && <p className="mt-1.5 text-xs text-dim">{hint}</p>}
        </div>
        {Ico && (
          <div className={`flex-shrink-0 h-9 w-9 rounded-lg ${accentBg.bg} ${accentBg.text} flex items-center justify-center`}>
            <Ico className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
 * SECTION HEADER (inside a card)
 * ============================================================ */
export function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h3 className="h2">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted max-w-2xl">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

/* ============================================================
 * BADGE / STATUS DOT
 * ============================================================ */
const BADGE_VARIANTS = {
  gray:    'bg-gray-100 text-gray-700 ring-gray-200',
  blue:    'bg-blue-50  text-blue-700  ring-blue-200',
  green:   'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber:   'bg-amber-50 text-amber-700 ring-amber-200',
  red:     'bg-rose-50  text-rose-700  ring-rose-200',
  violet:  'bg-violet-50 text-violet-700 ring-violet-200',
  cyan:    'bg-cyan-50  text-cyan-700  ring-cyan-200',
};
export function Badge({ children, variant = 'gray', size = 'sm' }) {
  const sizeClass = size === 'md' ? 'text-xs px-2.5 py-1' : 'text-[11px] px-2 py-0.5';
  return <span className={`inline-flex items-center gap-1 rounded-full ring-1 ring-inset font-medium ${BADGE_VARIANTS[variant] || BADGE_VARIANTS.gray} ${sizeClass}`}>{children}</span>;
}

const DOT_COLORS = {
  emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500',
  blue: 'bg-blue-500', gray: 'bg-gray-400', violet: 'bg-violet-500',
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

/* ============================================================
 * EMPTY STATE
 * ============================================================ */
export function EmptyState({ icon: Ico = Icon.Layers, title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 bg-white p-12 text-center">
      <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 flex items-center justify-center mb-4">
        <Ico className="h-5 w-5 text-gray-500" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1.5 text-sm text-muted max-w-sm mx-auto leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ============================================================
 * TABLE
 * ============================================================ */
export function Table({ children, className = '' }) {
  return (
    <div className={`card-elevated overflow-hidden ${className}`}>
      <div className="overflow-x-auto"><table className="w-full text-sm">{children}</table></div>
    </div>
  );
}
export function THead({ children }) {
  return (
    <thead>
      <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-gray-500 border-b border-gray-100" style={{ background: 'var(--surface-muted)' }}>
        {children}
      </tr>
    </thead>
  );
}
export function TH({ children, align = 'left', className = '' }) {
  return <th className={`px-6 py-3 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</th>;
}
export function TBody({ children }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>;
}
export function TR({ children, hover = true, onClick }) {
  return <tr onClick={onClick} className={`${hover ? 'hover:bg-gray-50/70' : ''} ${onClick ? 'cursor-pointer' : ''} transition-colors`}>{children}</tr>;
}
export function TD({ children, align = 'left', className = '' }) {
  return <td className={`px-6 py-3.5 ${align === 'right' ? 'text-right' : ''} ${className}`}>{children}</td>;
}

/* ============================================================
 * SKELETON
 * ============================================================ */
export function Skeleton({ className = '', width, height }) {
  return <div className={`skeleton ${className}`} style={{ width, height }} />;
}

/* ============================================================
 * FILTER BAR — pill segmented control
 * ============================================================ */
export function FilterBar({ options, value, onChange, getCount }) {
  return (
    <div className="inline-flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
      {options.map((opt) => {
        const isActive = value === opt.value;
        const count = getCount ? getCount(opt.value) : null;
        return (
          <button key={opt.value} onClick={() => onChange(opt.value)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all whitespace-nowrap ${
              isActive ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
            }`}>
            {opt.label}
            {count != null && <span className={`ml-1.5 tabular-nums ${isActive ? 'text-gray-500' : 'text-gray-400'}`}>· {count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
 * MONEY
 * ============================================================ */
export function money(cents, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format((cents || 0) / 100);
}

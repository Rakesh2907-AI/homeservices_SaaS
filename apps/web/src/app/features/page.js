import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FeatureIcon, BrowserMockup } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = {
  title: 'Features — ServiceHub',
  description: 'Everything you need to run a modern home services business.',
};

// ---- Mock illustrations for each pillar (pure SVG + JSX, no images) ----

function CustomerPortalMock() {
  return (
    <BrowserMockup url="yourbiz.servicehub.app">
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500" />
            <div className="font-semibold text-gray-900">Your Brand</div>
          </div>
          <div className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-700 font-medium">Book now</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
          <div className="text-2xl font-bold text-gray-900">Book a service in 30 seconds</div>
          <div className="text-sm text-gray-600 mt-1">Real-time availability · No phone calls</div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {['Plumbing', 'HVAC', 'Electric'].map((s) => (
            <div key={s} className="rounded-lg border border-gray-200 p-3 text-center">
              <div className="h-8 w-8 rounded-md bg-blue-100 mx-auto mb-2" />
              <div className="text-xs font-medium text-gray-700">{s}</div>
            </div>
          ))}
        </div>
      </div>
    </BrowserMockup>
  );
}

function CalendarMock() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">This week</div>
        <div className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="h-2 w-2 rounded-full bg-amber-500" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 pb-2">{d}</div>
        ))}
        {/* Day slots — represented as colored bars at varying heights */}
        {Array.from({ length: 5 }).map((_, day) => (
          <div key={day} className="space-y-1">
            {[
              { color: 'bg-blue-500', label: '9am', show: day !== 1 },
              { color: 'bg-emerald-500', label: '11am', show: true },
              { color: 'bg-amber-500', label: '2pm', show: day !== 3 },
              { color: 'bg-blue-500', label: '4pm', show: day === 0 || day === 4 },
            ].filter((s) => s.show).map((s, i) => (
              <div key={i} className={`${s.color} rounded text-white text-[10px] px-1.5 py-1 leading-tight`}>
                {s.label}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>23 jobs scheduled</span>
        <span className="font-medium text-blue-600">94% capacity</span>
      </div>
    </div>
  );
}

function PricingMock() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10">
      <div className="font-mono text-xs text-gray-500 mb-3 flex items-center gap-2">
        <Icon.Code className="h-4 w-4" /> Pricing rules
      </div>
      <div className="space-y-2">
        {[
          ['Flat fee', 'Standard service', '$149.00', 'bg-blue-50 text-blue-700'],
          ['Hourly', 'Diagnostic time', '$95.00 /hr', 'bg-emerald-50 text-emerald-700'],
          ['Distance', 'Outside 30mi radius', '+$2.50 /mi', 'bg-amber-50 text-amber-700'],
          ['Sq.ft', 'Carpet cleaning', '$0.35 /sqft', 'bg-violet-50 text-violet-700'],
          ['After-hours', 'Weekend / 6pm+', '+50%', 'bg-rose-50 text-rose-700'],
        ].map(([type, label, rate, color]) => (
          <div key={label} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
            <span className={`text-xs font-mono px-2 py-1 rounded ${color}`}>{type}</span>
            <span className="text-sm text-gray-700 flex-1">{label}</span>
            <span className="text-sm font-semibold text-gray-900">{rate}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsMock() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl shadow-gray-900/10">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-gray-900">Revenue · Last 30 days</div>
        <div className="text-xs font-medium text-emerald-600 flex items-center gap-1">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
          </svg>
          +24%
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">$48,320</div>
      <div className="mt-4 h-32 relative">
        <svg className="w-full h-full" viewBox="0 0 300 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M0,80 Q30,70 50,60 T100,40 T150,30 T200,20 T250,15 T300,5 L300,100 L0,100 Z" fill="url(#rev-grad)" />
          <path d="M0,80 Q30,70 50,60 T100,40 T150,30 T200,20 T250,15 T300,5" stroke="#3b82f6" strokeWidth="2" fill="none" />
        </svg>
      </div>
      <div className="grid grid-cols-3 gap-3 mt-4">
        {[['127', 'Bookings'], ['82%', 'Conversion'], ['$381', 'Avg ticket']].map(([n, l]) => (
          <div key={l} className="rounded-lg bg-gray-50 p-3">
            <div className="text-sm font-bold text-gray-900">{n}</div>
            <div className="text-[10px] text-gray-500">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PILLARS = [
  {
    eyebrow: 'Customer experience',
    Ico: Icon.Palette,
    iconGradient: 'from-blue-500 to-cyan-500',
    title: 'A branded portal customers actually use',
    points: [
      'Custom subdomain — yourbusiness.servicehub.app or your own domain',
      '6 professional themes + custom colors, fonts, logo',
      'Mobile-first booking flow with real-time availability',
      'Automated email + SMS confirmations and reminders',
      'Customer accounts with booking history and saved payment methods',
    ],
    Mock: CustomerPortalMock,
  },
  {
    eyebrow: 'Operations',
    Ico: Icon.Calendar,
    iconGradient: 'from-violet-500 to-purple-500',
    title: 'Dispatch that runs itself',
    points: [
      'Drag-and-drop calendar across all technicians',
      'Smart route optimization with Google Maps integration',
      'Real-time tech tracking and ETA updates to customers',
      'Auto-assignment based on skills, location, and availability',
      'Photo capture for before/after job records',
    ],
    Mock: CalendarMock,
  },
  {
    eyebrow: 'Revenue',
    Ico: Icon.Dollar,
    iconGradient: 'from-emerald-500 to-teal-500',
    title: 'Pricing that fits how you actually charge',
    points: [
      'Flat-fee, hourly, distance-based, or square-footage rules',
      'Discount codes, seasonal pricing, and member pricing',
      'Quote-to-invoice flow with online payments (Stripe / ACH)',
      'Commission structures for staff, platform, and franchise models',
      'Tax handling per jurisdiction',
    ],
    Mock: PricingMock,
  },
  {
    eyebrow: 'Insight',
    Ico: Icon.Chart,
    iconGradient: 'from-amber-500 to-orange-500',
    title: 'Analytics built for the field',
    points: [
      'Booking funnel — see where customers drop off',
      'Technician utilization, revenue per tech, conversion by service',
      'Customer LTV cohort tables',
      'Daily / weekly / monthly P&L by category',
      'Export to CSV or push to your warehouse',
    ],
    Mock: AnalyticsMock,
  },
];

const CAPABILITIES = [
  ['Booking widget', 'Embed on your existing site with one line of HTML', Icon.Code],
  ['Online payments', 'Stripe, ACH, Apple Pay, Google Pay', Icon.Dollar],
  ['Recurring services', 'Weekly, monthly, quarterly with auto-billing', Icon.Calendar],
  ['Inventory tracking', 'Track parts, alert on low stock, deduct on completion', Icon.Layers],
  ['Quotes & estimates', 'Send PDF quotes, customer e-signature', Icon.Newspaper],
  ['Reviews & ratings', 'Automatic post-job review requests, public display', Icon.Star],
  ['Multi-location', 'Run multiple branches from one account', Icon.Map],
  ['Staff timesheets', 'Clock in/out with geofencing', Icon.Calendar],
  ['Customer notes', 'Job history, preferences, gate codes', Icon.MessageCircle],
  ['Document storage', 'Permits, photos, contracts attached to bookings', Icon.Layers],
  ['Reports library', '30+ pre-built reports, custom report builder', Icon.Chart],
  ['API access', 'REST + webhooks. Build anything.', Icon.Code],
];

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Features</Eyebrow>
            <H2>Everything you need. Nothing you don&apos;t.</H2>
            <Lead>ServiceHub replaces booking software, dispatch tools, CRM, billing, and analytics — all from one place, all sharing the same data.</Lead>
          </div>
        </Section>
      </section>

      {PILLARS.map((p, i) => (
        <section key={p.title} className={`relative overflow-hidden ${i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
          {i % 2 === 0 && <DotGrid className="opacity-40" />}
          <div className="max-w-7xl mx-auto px-6 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                <FeatureIcon gradient={p.iconGradient}>
                  <p.Ico className="h-6 w-6" />
                </FeatureIcon>
                <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-blue-600">{p.eyebrow}</p>
                <H2 className="mt-2">{p.title}</H2>
                <ul className="mt-8 space-y-4">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5 h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <Icon.Check className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`relative ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                {/* Decorative glow */}
                <div className="absolute -inset-8 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-3xl blur-3xl" />
                <div className="relative">
                  <p.Mock />
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}

      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Plus 30+ more</Eyebrow>
          <H2>Every capability your business needs</H2>
          <Lead>From inventory tracking to multi-location management — it&apos;s all included, on every plan.</Lead>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map(([t, d, Ico]) => (
            <div key={t} className="group rounded-lg border border-gray-200 p-5 lift">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center group-hover:from-blue-500 group-hover:to-cyan-500 transition-colors">
                  <Ico className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">{t}</h3>
                  <p className="text-sm text-gray-600">{d}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section bg="gray">
        <div className="text-center">
          <H2>See it in action</H2>
          <Lead className="mx-auto">Get a personalized demo or jump straight into a 14-day free trial.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/signup" className="shimmer inline-flex items-center gap-2 rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">
              Start free trial <Icon.ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">Book a demo</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

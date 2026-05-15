import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';

export const metadata = {
  title: 'Features — ServiceHub',
  description: 'Everything you need to run a modern home services business.',
};

const PILLARS = [
  {
    eyebrow: 'Customer experience',
    title: 'A branded portal customers actually use',
    points: [
      'Custom subdomain — yourbusiness.servicehub.app or your own domain',
      '6 professional themes + custom colors, fonts, logo',
      'Mobile-first booking flow with real-time availability',
      'Automated email + SMS confirmations and reminders',
      'Customer accounts with booking history and saved payment methods',
    ],
    image: '🎨',
  },
  {
    eyebrow: 'Operations',
    title: 'Dispatch that runs itself',
    points: [
      'Drag-and-drop calendar across all technicians',
      'Smart route optimization with Google Maps integration',
      'Real-time tech tracking and ETA updates to customers',
      'Auto-assignment based on skills, location, and availability',
      'Photo capture for before/after job records',
    ],
    image: '📅',
  },
  {
    eyebrow: 'Revenue',
    title: 'Pricing that fits how you actually charge',
    points: [
      'Flat-fee, hourly, distance-based, or square-footage rules',
      'Discount codes, seasonal pricing, and member pricing',
      'Quote-to-invoice flow with online payments (Stripe / ACH)',
      'Commission structures for staff, platform, and franchise models',
      'Tax handling per jurisdiction',
    ],
    image: '💰',
  },
  {
    eyebrow: 'Insight',
    title: 'Analytics built for the field',
    points: [
      'Booking funnel — see where customers drop off',
      'Technician utilization, revenue per tech, conversion by service',
      'Customer LTV cohort tables',
      'Daily / weekly / monthly P&L by category',
      'Export to CSV or push to your warehouse',
    ],
    image: '📊',
  },
];

const CAPABILITIES = [
  ['Booking widget', 'Embed on your existing site with one line of HTML'],
  ['Online payments', 'Stripe, ACH, Apple Pay, Google Pay'],
  ['Recurring services', 'Weekly, monthly, quarterly with auto-billing'],
  ['Inventory tracking', 'Track parts, alert on low stock, deduct on completion'],
  ['Quotes & estimates', 'Send PDF quotes, customer e-signature'],
  ['Reviews & ratings', 'Automatic post-job review requests, public display'],
  ['Multi-location', 'Run multiple branches from one account'],
  ['Staff timesheets', 'Clock in/out with geofencing'],
  ['Customer notes', 'Job history, preferences, gate codes'],
  ['Document storage', 'Permits, photos, contracts attached to bookings'],
  ['Reports library', '30+ pre-built reports, custom report builder'],
  ['API access', 'REST + webhooks. Build anything.'],
];

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Features</Eyebrow>
          <H2>Everything you need. Nothing you don&apos;t.</H2>
          <Lead>ServiceHub replaces booking software, dispatch tools, CRM, billing, and analytics — all from one place, all sharing the same data.</Lead>
        </div>
      </Section>

      {/* PILLARS */}
      {PILLARS.map((p, i) => (
        <Section key={p.title} bg={i % 2 === 0 ? 'gray' : 'white'}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
              <Eyebrow>{p.eyebrow}</Eyebrow>
              <H2>{p.title}</H2>
              <ul className="mt-8 space-y-4">
                {p.points.map((pt) => (
                  <li key={pt} className="flex gap-3">
                    <svg className="h-6 w-6 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className={`aspect-square rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-gray-200 flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
              <div className="text-9xl opacity-50">{p.image}</div>
            </div>
          </div>
        </Section>
      ))}

      {/* CAPABILITIES GRID */}
      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Plus 30+ more</Eyebrow>
          <H2>Every capability your business needs</H2>
          <Lead>From inventory tracking to multi-location management — it&apos;s all included, on every plan.</Lead>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAPABILITIES.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-gray-200 p-5 hover:border-blue-300 transition">
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{t}</h3>
              <p className="text-sm text-gray-600">{d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section bg="gray">
        <div className="text-center">
          <H2>See it in action</H2>
          <Lead className="mx-auto">Get a personalized demo or jump straight into a 14-day free trial.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/signup" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Start free trial</Link>
            <Link href="/contact" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">Book a demo</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

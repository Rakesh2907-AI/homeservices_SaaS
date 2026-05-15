'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { getSession } from '@/lib/api';

const FEATURES = [
  {
    icon: '🎨',
    title: 'White-labeled customer portal',
    desc: 'Your logo, your colors, your subdomain. Customers see your brand — never ours.',
  },
  {
    icon: '📅',
    title: 'Smart scheduling & dispatch',
    desc: 'Drag-and-drop calendar, route optimization, real-time technician tracking.',
  },
  {
    icon: '💰',
    title: 'Flexible pricing engine',
    desc: 'Flat fees, hourly rates, square footage, distance — model any pricing rule.',
  },
  {
    icon: '🔒',
    title: 'Database-level isolation',
    desc: 'Postgres Row-Level Security keeps your data physically isolated from other businesses.',
  },
  {
    icon: '📊',
    title: 'Built-in analytics',
    desc: 'Track conversion rates, technician utilization, customer LTV — without buying another tool.',
  },
  {
    icon: '⚡',
    title: 'API-first architecture',
    desc: 'Integrate with QuickBooks, Stripe, Twilio, or build custom workflows. Zapier ready.',
  },
];

const LOGOS = ['Acme Plumbing', 'TidyHome', 'GreenLawn Co', 'BrightSpark', 'RapidFix', 'CoolBreeze HVAC'];

const STATS = [
  ['10,000+', 'service businesses'],
  ['2.4M', 'bookings processed'],
  ['99.99%', 'platform uptime'],
  ['< 100ms', 'p95 API latency'],
];

const TESTIMONIALS = [
  {
    quote: 'We migrated from a clunky legacy system in one weekend. Bookings doubled in the first month because customers can finally self-serve.',
    author: 'Maya Patel',
    role: 'Owner, BrightSpark Electrical',
    avatar: 'MP',
  },
  {
    quote: 'The branded portal made us look like a national chain overnight. Our close rate on quotes went from 22% to 41%.',
    author: 'Diego Alvarez',
    role: 'Founder, CoolBreeze HVAC',
    avatar: 'DA',
  },
  {
    quote: 'We have 47 technicians across 3 states on the Pro plan. The audit log and per-tenant deploys mean compliance is no longer a fire drill.',
    author: 'Sarah Chen',
    role: 'COO, RapidFix Group',
    avatar: 'SC',
  },
];

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => { setHasSession(!!getSession().token); }, []);

  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-32 md:pb-32 relative">
          <div className="absolute inset-0 -z-10 opacity-30">
            <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-blue-100 blur-3xl" />
            <div className="absolute top-32 left-12 h-72 w-72 rounded-full bg-cyan-100 blur-3xl" />
          </div>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 mb-6">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              New: per-tenant feature flags & GitOps deployments
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
              Run your home services business —{' '}
              <span className="gradient-text">your way</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl">
              ServiceHub is the all-in-one SaaS platform for plumbers, electricians, HVAC, cleaning, and landscaping
              businesses. Branded customer portal, dispatch, pricing, and analytics — set up in under 5 minutes.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              {hasSession ? (
                <Link href="/dashboard" className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition">
                  Go to dashboard →
                </Link>
              ) : (
                <>
                  <Link href="/signup" className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition">
                    Start 14-day free trial
                  </Link>
                  <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400 transition">
                    Book a demo
                  </Link>
                </>
              )}
            </div>
            <p className="mt-4 text-sm text-gray-500">No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      {/* LOGO CLOUD */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-sm font-medium text-gray-500 mb-8">
            Trusted by service businesses in 47 states
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 items-center">
            {LOGOS.map((name) => (
              <div key={name} className="text-center text-gray-400 font-semibold text-sm">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(([n, l]) => (
            <div key={l}>
              <div className="text-4xl md:text-5xl font-bold text-gray-900">{n}</div>
              <div className="mt-2 text-sm text-gray-600">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* FEATURES GRID */}
      <Section bg="gray">
        <div className="max-w-3xl">
          <Eyebrow>Everything in one platform</Eyebrow>
          <H2>Built for service businesses, not generic CRMs</H2>
          <Lead>Stop stitching together QuickBooks, Calendly, Mailchimp, and a custom spreadsheet. ServiceHub replaces 6+ tools.</Lead>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/features" className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700">
            See all features →
          </Link>
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <Section>
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <H2 className="mx-auto">From signup to first booking in under 5 minutes</H2>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            ['1', 'Sign up', 'Create your account and pick your subdomain — yourname.servicehub.app'],
            ['2', 'Brand it', 'Choose a theme, upload your logo, set your colors. Live preview as you go.'],
            ['3', 'Configure', 'Add categories, services, pricing rules, and commission structure.'],
            ['4', 'Go live', 'Share your portal URL. Customers can book 24/7.'],
          ].map(([n, t, d]) => (
            <div key={n} className="relative">
              <div className="absolute -top-2 -left-2 h-12 w-12 rounded-full bg-blue-600 text-white text-lg font-bold flex items-center justify-center">{n}</div>
              <div className="pl-14">
                <h3 className="font-semibold text-gray-900 mb-2">{t}</h3>
                <p className="text-sm text-gray-600">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TESTIMONIALS */}
      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>What customers say</Eyebrow>
          <H2>Loved by 10,000+ service businesses</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t) => (
            <figure key={t.author} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118L10 13.347l-2.799 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L3.567 7.819c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <blockquote className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</blockquote>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold text-sm">{t.avatar}</div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{t.author}</div>
                  <div className="text-xs text-gray-500">{t.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-8 py-16 md:px-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to modernize your business?</h2>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">Join thousands of service pros who&apos;ve switched to ServiceHub. 14-day free trial. No credit card. No risk.</p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/signup" className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 transition">
                Start free trial
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-transparent px-6 py-3 text-base font-medium text-white hover:bg-white/5 transition">
                See pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

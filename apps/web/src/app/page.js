'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, LineGrid, MeshGradient, FloatingShapes, Marquee, FeatureIcon, BrowserMockup } from '@/components/marketing/decorations';
import AnimatedCounter from '@/components/marketing/AnimatedCounter';
import RevealOnScroll from '@/components/marketing/Reveal';
import { Icon } from '@/components/marketing/icons';
import { getSession } from '@/lib/api';

const FEATURES = [
  { Ico: Icon.Palette, title: 'White-labeled customer portal', desc: 'Your logo, your colors, your subdomain. Customers see your brand — never ours.', gradient: 'from-blue-500 to-cyan-500' },
  { Ico: Icon.Calendar, title: 'Smart scheduling & dispatch', desc: 'Drag-and-drop calendar, route optimization, real-time technician tracking.', gradient: 'from-violet-500 to-purple-500' },
  { Ico: Icon.Dollar, title: 'Flexible pricing engine', desc: 'Flat fees, hourly rates, square footage, distance — model any pricing rule.', gradient: 'from-emerald-500 to-teal-500' },
  { Ico: Icon.Shield, title: 'Database-level isolation', desc: 'Postgres Row-Level Security keeps your data physically isolated from other businesses.', gradient: 'from-rose-500 to-pink-500' },
  { Ico: Icon.Chart, title: 'Built-in analytics', desc: 'Track conversion rates, technician utilization, customer LTV — without buying another tool.', gradient: 'from-amber-500 to-orange-500' },
  { Ico: Icon.Bolt, title: 'API-first architecture', desc: 'Integrate with QuickBooks, Stripe, Twilio, or build custom workflows. Zapier ready.', gradient: 'from-indigo-500 to-blue-500' },
];

const LOGOS = [
  { name: 'Acme Plumbing', icon: '🔧' },
  { name: 'TidyHome', icon: '🧹' },
  { name: 'GreenLawn Co', icon: '🌿' },
  { name: 'BrightSpark', icon: '⚡' },
  { name: 'RapidFix', icon: '🛠️' },
  { name: 'CoolBreeze HVAC', icon: '❄️' },
  { name: 'PaintPro', icon: '🎨' },
  { name: 'SafeRoof', icon: '🏠' },
];

const STATS = [
  ['10,000+', 'service businesses'],
  ['2.4M', 'bookings processed'],
  ['99.99%', 'platform uptime'],
  ['< 100ms', 'p95 API latency'],
];

const TESTIMONIALS = [
  { quote: 'We migrated from a clunky legacy system in one weekend. Bookings doubled in the first month because customers can finally self-serve.', author: 'Maya Patel', role: 'Owner, BrightSpark Electrical', avatar: 'MP', gradient: 'from-blue-500 to-purple-500' },
  { quote: 'The branded portal made us look like a national chain overnight. Our close rate on quotes went from 22% to 41%.', author: 'Diego Alvarez', role: 'Founder, CoolBreeze HVAC', avatar: 'DA', gradient: 'from-cyan-500 to-blue-500' },
  { quote: 'We have 47 technicians across 3 states on the Pro plan. The audit log and per-tenant deploys mean compliance is no longer a fire drill.', author: 'Sarah Chen', role: 'COO, RapidFix Group', avatar: 'SC', gradient: 'from-pink-500 to-orange-500' },
];

export default function HomePage() {
  const [hasSession, setHasSession] = useState(false);
  useEffect(() => { setHasSession(!!getSession().token); }, []);

  return (
    <MarketingLayout>
      {/* ============= HERO ============= */}
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <MeshGradient />
        <DotGrid className="opacity-30" />

        <div className="max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* LEFT: text */}
            <div>
              <RevealOnScroll>
                <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 backdrop-blur px-3 py-1 text-xs font-medium text-gray-600 mb-6 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  New: per-tenant feature flags & GitOps deployments
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={100}>
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold tracking-tight text-gray-900 leading-[1.05]">
                  Run your home services business —{' '}
                  <span className="gradient-text animated-gradient" style={{ backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #06b6d4 50%, #2563eb 100%)' }}>your way</span>
                </h1>
              </RevealOnScroll>

              <RevealOnScroll delay={200}>
                <p className="mt-6 text-xl text-gray-600 max-w-xl leading-relaxed">
                  The all-in-one SaaS for plumbers, electricians, HVAC, cleaning, and landscaping businesses.
                  Branded customer portal, dispatch, pricing, and analytics — set up in under 5 minutes.
                </p>
              </RevealOnScroll>

              <RevealOnScroll delay={300}>
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  {hasSession ? (
                    <Link href="/dashboard" className="shimmer inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-900/20">
                      Go to dashboard <Icon.ArrowRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <>
                      <Link href="/signup" className="shimmer inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800 transition shadow-lg shadow-gray-900/20">
                        Start 14-day free trial <Icon.ArrowRight className="h-4 w-4" />
                      </Link>
                      <Link href="/contact" className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white/80 backdrop-blur px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400 transition">
                        Book a demo
                      </Link>
                    </>
                  )}
                </div>
              </RevealOnScroll>

              <RevealOnScroll delay={400}>
                <div className="mt-6 flex items-center gap-6 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5"><Icon.Check className="h-4 w-4 text-emerald-500" /> No credit card</span>
                  <span className="flex items-center gap-1.5"><Icon.Check className="h-4 w-4 text-emerald-500" /> Cancel anytime</span>
                  <span className="hidden sm:flex items-center gap-1.5"><Icon.Check className="h-4 w-4 text-emerald-500" /> 5-min setup</span>
                </div>
              </RevealOnScroll>
            </div>

            {/* RIGHT: browser mockup */}
            <RevealOnScroll delay={300} className="relative">
              <div className="relative">
                {/* Decorative glow behind mockup */}
                <div className="absolute -inset-8 bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-blue-400/30 blur-3xl rounded-full" />

                <BrowserMockup url="acme.servicehub.app" className="relative animate-float-medium">
                  <div className="p-6">
                    {/* App header */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500" />
                        <div>
                          <div className="font-semibold text-gray-900">Acme Plumbing</div>
                          <div className="text-xs text-gray-500">Pro plan</div>
                        </div>
                      </div>
                      <div className="text-xs rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 font-medium">Online</div>
                    </div>

                    {/* Mini stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                      {[['$8.2k', 'Today'], ['47', 'Jobs'], ['4.9★', 'Rating']].map(([n, l]) => (
                        <div key={l} className="rounded-lg bg-gray-50 p-3">
                          <div className="text-lg font-bold text-gray-900">{n}</div>
                          <div className="text-xs text-gray-500">{l}</div>
                        </div>
                      ))}
                    </div>

                    {/* Booking list */}
                    <div className="space-y-2">
                      {[
                        ['9:00', 'Jane Smith', 'Drain unclog', '#22c55e'],
                        ['11:30', 'Bob Wilson', 'Water heater', '#3b82f6'],
                        ['2:00', 'Lila Cruz', 'Leak repair', '#f59e0b'],
                      ].map(([time, name, svc, color], i) => (
                        <div key={i} className="flex items-center gap-3 rounded-md border border-gray-100 px-3 py-2">
                          <div className="text-xs font-mono text-gray-500 w-12">{time}</div>
                          <div className="h-2 w-2 rounded-full" style={{ background: color }} />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">{svc}</div>
                          </div>
                          <div className="text-xs text-gray-400">→</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </BrowserMockup>

                {/* Floating "live booking" badge */}
                <div className="absolute -top-4 -right-4 lg:right-auto lg:-left-12 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-xl animate-float-medium" style={{ animationDelay: '1.5s' }}>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <Icon.Check className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-900">New booking</div>
                      <div className="text-xs text-gray-500">$149 · 2:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ============= LOGO MARQUEE ============= */}
      <section className="bg-white border-y border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <p className="text-center text-sm font-medium text-gray-500 mb-8">
            Trusted by service businesses in 47 states
          </p>
          <Marquee items={LOGOS} />
        </div>
      </section>

      {/* ============= STATS — animated counters ============= */}
      <Section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STATS.map(([n, l], i) => (
            <RevealOnScroll key={l} delay={i * 100}>
              <div className="text-4xl md:text-5xl font-bold gradient-text">
                <AnimatedCounter value={n} />
              </div>
              <div className="mt-2 text-sm text-gray-600">{l}</div>
            </RevealOnScroll>
          ))}
        </div>
      </Section>

      {/* ============= FEATURES GRID ============= */}
      <section className="relative bg-gray-50 overflow-hidden">
        <LineGrid />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 relative">
          <div className="max-w-3xl">
            <Eyebrow>Everything in one platform</Eyebrow>
            <H2>Built for service businesses, not generic CRMs</H2>
            <Lead>Stop stitching together QuickBooks, Calendly, Mailchimp, and a custom spreadsheet. ServiceHub replaces 6+ tools.</Lead>
          </div>
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <RevealOnScroll key={f.title} delay={i * 60}>
                <div className="group relative rounded-xl border border-gray-200 bg-white p-6 lift overflow-hidden">
                  {/* Hover gradient accent */}
                  <div className={`absolute -top-px -left-px -right-px h-1 bg-gradient-to-r ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity`} />
                  <FeatureIcon gradient={f.gradient}>
                    <f.Ico className="h-6 w-6" />
                  </FeatureIcon>
                  <h3 className="font-semibold text-gray-900 mt-4 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href="/features" className="link-underline inline-flex items-center gap-1 text-blue-600 font-medium">
              See all features <Icon.ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ============= HOW IT WORKS ============= */}
      <Section>
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow>How it works</Eyebrow>
          <H2 className="mx-auto">From signup to first booking in under 5 minutes</H2>
        </div>
        <div className="mt-16 relative">
          {/* Connecting line behind steps */}
          <div aria-hidden className="hidden md:block absolute top-6 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-cyan-200 to-blue-200" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {[
              ['Sign up', 'Create your account and pick your subdomain — yourname.servicehub.app', 'from-blue-500 to-cyan-500'],
              ['Brand it', 'Choose a theme, upload your logo, set your colors. Live preview as you go.', 'from-cyan-500 to-emerald-500'],
              ['Configure', 'Add categories, services, pricing rules, and commission structure.', 'from-emerald-500 to-amber-500'],
              ['Go live', 'Share your portal URL. Customers can book 24/7.', 'from-amber-500 to-rose-500'],
            ].map(([t, d, g], i) => (
              <RevealOnScroll key={t} delay={i * 120}>
                <div className="text-center">
                  <div className={`relative mx-auto h-12 w-12 rounded-full bg-gradient-to-br ${g} text-white text-lg font-bold flex items-center justify-center shadow-lg`}>
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-semibold text-gray-900">{t}</h3>
                  <p className="mt-2 text-sm text-gray-600 max-w-xs mx-auto">{d}</p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </Section>

      {/* ============= TESTIMONIALS ============= */}
      <section className="relative bg-gray-50 overflow-hidden">
        <FloatingShapes />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24 relative">
          <div className="max-w-3xl mb-12">
            <Eyebrow>What customers say</Eyebrow>
            <H2>Loved by 10,000+ service businesses</H2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <RevealOnScroll key={t.author} delay={i * 100}>
                <figure className="relative h-full rounded-xl border border-gray-200 bg-white p-6 lift overflow-hidden">
                  {/* Decorative quote mark */}
                  <svg aria-hidden className="absolute -top-2 -right-2 h-24 w-24 text-gray-100" fill="currentColor" viewBox="0 0 32 32">
                    <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
                  </svg>
                  <div className="relative">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => <Icon.Star key={i} className="h-5 w-5 text-amber-400" />)}
                    </div>
                    <blockquote className="text-gray-700 text-sm leading-relaxed mb-6">"{t.quote}"</blockquote>
                    <figcaption className="flex items-center gap-3 pt-4 border-t border-gray-100">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-semibold text-sm`}>{t.avatar}</div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{t.author}</div>
                        <div className="text-xs text-gray-500">{t.role}</div>
                      </div>
                    </figcaption>
                  </div>
                </figure>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* ============= CTA ============= */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-6 py-20">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 px-8 py-16 md:px-16 text-center">
              {/* Animated glow */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-blue-500 blur-3xl animate-pulse-soft" />
                <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-cyan-500 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
              </div>
              <div className="relative">
                <h2 className="text-3xl md:text-5xl font-bold text-white">Ready to modernize your business?</h2>
                <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">Join thousands of service pros who&apos;ve switched to ServiceHub. 14-day free trial. No credit card. No risk.</p>
                <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/signup" className="shimmer inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-base font-medium text-gray-900 hover:bg-gray-100 transition">
                    Start free trial <Icon.ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link href="/pricing" className="inline-flex items-center justify-center rounded-md border border-gray-600 bg-transparent px-6 py-3 text-base font-medium text-white hover:bg-white/5 transition">
                    See pricing
                  </Link>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>
    </MarketingLayout>
  );
}


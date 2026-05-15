import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FeatureIcon } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Documentation — ServiceHub' };

const SECTIONS = [
  {
    Ico: Icon.Bolt, gradient: 'from-blue-500 to-cyan-500', title: 'Getting started', desc: 'Sign up, configure, and take your first booking in under 5 minutes.',
    links: ['Quickstart (5 min)', 'Onboarding wizard walkthrough', 'Importing existing data', 'Inviting team members'],
  },
  {
    Ico: Icon.Palette, gradient: 'from-violet-500 to-purple-500', title: 'Branding & themes', desc: 'Customize colors, fonts, logos, and your customer portal URL.',
    links: ['Theme presets', 'Custom CSS overrides', 'Custom domain setup', 'Logo guidelines'],
  },
  {
    Ico: Icon.Dollar, gradient: 'from-emerald-500 to-teal-500', title: 'Pricing & billing',  desc: 'Configure pricing rules, commissions, taxes, and online payments.',
    links: ['Pricing rule types', 'Commission structures', 'Tax configuration', 'Stripe connection'],
  },
  {
    Ico: Icon.Calendar, gradient: 'from-amber-500 to-orange-500', title: 'Scheduling & dispatch',  desc: 'Calendars, route optimization, technician assignment.',
    links: ['Calendar view', 'Auto-assignment rules', 'Route optimization', 'Geofenced timesheets'],
  },
  {
    Ico: Icon.Code, gradient: 'from-indigo-500 to-blue-500', title: 'API & webhooks', desc: 'REST API reference, authentication, webhooks, rate limits.',
    links: ['API authentication', 'Booking endpoints', 'Webhook events', 'Rate limits & quotas'],
  },
  {
    Ico: Icon.Shield, gradient: 'from-rose-500 to-pink-500', title: 'Security & compliance',  desc: 'How we keep your data safe and how to manage access.',
    links: ['Data isolation model', 'SOC 2 reports', 'GDPR / CCPA compliance', 'Audit logs'],
  },
];

const POPULAR = [
  'How to import bookings from an existing system',
  'Setting up a custom domain (yourbiz.com)',
  'Configuring distance-based pricing',
  'Webhooks: subscribing to booking.created',
  'Adding multiple business locations',
  'Exporting your data',
];

export default function DocsPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Documentation</Eyebrow>
            <H2>Everything you need to build with ServiceHub</H2>
            <Lead>Guides, references, and how-tos for every part of the platform. Searchable, copy-pasteable, and kept up to date.</Lead>
            <div className="mt-8 max-w-xl relative">
              <input
                type="search"
                placeholder="Search the docs…"
                className="w-full rounded-lg border border-gray-300 bg-white px-5 py-4 pr-12 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 text-xs rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-gray-500">⌘ K</kbd>
            </div>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Browse by topic</Eyebrow>
          <H2>Documentation sections</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SECTIONS.map((s) => (
            <div key={s.title} className="rounded-xl bg-white border border-gray-200 p-6 lift">
              <FeatureIcon gradient={s.gradient}>
                <s.Ico className="h-6 w-6" />
              </FeatureIcon>
              <h3 className="mt-4 font-semibold text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
              <ul className="mt-4 space-y-2">
                {s.links.map((l) => (
                  <li key={l}>
                    <Link href="#" className="text-sm text-blue-600 link-underline flex items-center gap-1">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mb-8">
          <Eyebrow>Popular articles</Eyebrow>
          <H2>Most-read this week</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {POPULAR.map((t) => (
            <Link key={t} href="#" className="flex items-center justify-between rounded-lg border border-gray-200 p-4 lift group">
              <span className="text-sm text-gray-900 group-hover:text-blue-600 transition">{t}</span>
              <Icon.ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition" />
            </Link>
          ))}
        </div>
      </Section>

      <Section bg="gray">
        <div className="text-center">
          <H2>Can&apos;t find what you need?</H2>
          <Lead className="mx-auto">Our support team is one click away.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/support" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Visit support center</Link>
            <Link href="/contact" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">Contact us</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

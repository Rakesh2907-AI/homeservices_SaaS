import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, FloatingShapes } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Careers — ServiceHub' };

const OPENINGS = [
  { title: 'Senior Backend Engineer — Booking Platform', dept: 'Engineering', location: 'Remote (Americas)', type: 'Full-time' },
  { title: 'Staff SRE — Multi-Tenant Infrastructure', dept: 'Engineering', location: 'Toronto / Remote', type: 'Full-time' },
  { title: 'Product Designer — Onboarding & Activation', dept: 'Design', location: 'Portland / Remote', type: 'Full-time' },
  { title: 'Solutions Engineer', dept: 'Sales', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Customer Success Manager — SMB', dept: 'Customer Success', location: 'Remote (US)', type: 'Full-time' },
  { title: 'Engineering Manager — Pricing', dept: 'Engineering', location: 'Portland / Remote', type: 'Full-time' },
];

const PERKS = [
  ['Equity for everyone', 'Every employee gets meaningful equity. We&apos;re building this together.'],
  ['4-day work week', 'Monday through Thursday. Fridays are yours.'],
  ['Unlimited PTO (we mean it)', 'Minimum 4 weeks required. Leadership tracks usage and pings managers if their team isn&apos;t taking time off.'],
  ['$3,000 home office stipend', 'On hire, then $1,500/year for refreshes.'],
  ['Best-in-class health coverage', 'Medical, dental, vision — 100% covered for you and your dependents.'],
  ['Profit sharing', 'Quarterly distributions on top of salary.'],
  ['Conference + learning budget', '$2,500/year. No approvals needed.'],
  ['Annual offsite', 'A full week, fully expensed. 2026: Lisbon.'],
];

export default function CareersPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <FloatingShapes />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Careers</Eyebrow>
            <H2>Help us build software for the businesses that build everything else</H2>
            <Lead>We&apos;re hiring across engineering, design, sales, and customer success. Remote-first, profitable, and growing 8% month-over-month.</Lead>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Open roles</Eyebrow>
          <H2>{OPENINGS.length} positions open right now</H2>
        </div>
        <div className="space-y-3">
          {OPENINGS.map((o) => (
            <Link key={o.title} href="/contact" className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-5 lift hover:border-blue-300 group">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition flex items-center gap-2">
                  {o.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="text-xs rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 font-medium">{o.dept}</span>
                  <span className="text-xs text-gray-500 flex items-center gap-1"><Icon.Map className="h-3 w-3" /> {o.location}</span>
                  <span className="text-xs text-gray-500">{o.type}</span>
                </div>
              </div>
              <span className="text-sm text-blue-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Apply <Icon.ArrowRight className="h-4 w-4" /></span>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-gray-600">
          Don&apos;t see a role that fits? <Link href="/contact" className="text-blue-600 underline">Send us a note anyway</Link> — we hire great people whenever we meet them.
        </p>
      </Section>

      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>Perks & benefits</Eyebrow>
          <H2>Working at ServiceHub</H2>
          <Lead>Comprehensive coverage, generous time off, and the financial upside that comes with employee ownership.</Lead>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PERKS.map(([t, d], i) => (
            <div key={t} className="group relative rounded-lg border border-gray-200 p-6 lift overflow-hidden">
              <div aria-hidden className="absolute -top-8 -right-8 text-6xl font-bold text-gray-50 group-hover:text-blue-50 transition-colors leading-none select-none">{(i + 1).toString().padStart(2, '0')}</div>
              <div className="relative">
                <h3 className="font-semibold text-gray-900 mb-2" dangerouslySetInnerHTML={{ __html: t }} />
                <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: d }} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    </MarketingLayout>
  );
}

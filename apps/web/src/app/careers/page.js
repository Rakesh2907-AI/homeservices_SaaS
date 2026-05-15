import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';

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
      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Careers</Eyebrow>
          <H2>Help us build software for the businesses that build everything else</H2>
          <Lead>We&apos;re hiring across engineering, design, sales, and customer success. Remote-first, profitable, and growing 8% month-over-month.</Lead>
        </div>
      </Section>

      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Open roles</Eyebrow>
          <H2>{OPENINGS.length} positions open right now</H2>
        </div>
        <div className="space-y-3">
          {OPENINGS.map((o) => (
            <Link key={o.title} href="/contact" className="flex items-center justify-between rounded-lg bg-white border border-gray-200 p-5 hover:border-blue-300 transition group">
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">{o.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{o.dept} · {o.location} · {o.type}</p>
              </div>
              <span className="text-sm text-blue-600 font-medium">Apply →</span>
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
          {PERKS.map(([t, d]) => (
            <div key={t} className="rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-2" dangerouslySetInnerHTML={{ __html: t }} />
              <p className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: d }} />
            </div>
          ))}
        </div>
      </Section>
    </MarketingLayout>
  );
}

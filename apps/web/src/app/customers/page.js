import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';

export const metadata = {
  title: 'Customer stories — ServiceHub',
  description: 'How real service businesses grew with ServiceHub.',
};

const STORIES = [
  {
    company: 'BrightSpark Electrical',
    industry: 'Electrical',
    location: 'Austin, TX',
    size: '12 technicians',
    quote: 'We migrated from a clunky legacy system in one weekend. Bookings doubled in the first month because customers can finally self-serve.',
    author: 'Maya Patel, Owner',
    metrics: [['2x', 'bookings in first month'], ['41%', 'quote close rate'], ['9 hrs', 'saved per week per dispatcher']],
    bg: 'from-amber-100 to-yellow-50',
  },
  {
    company: 'CoolBreeze HVAC',
    industry: 'HVAC',
    location: 'Phoenix, AZ',
    size: '23 technicians, 2 locations',
    quote: 'The branded portal made us look like a national chain overnight. Our close rate on quotes went from 22% to 41%.',
    author: 'Diego Alvarez, Founder',
    metrics: [['+87%', 'quote-to-job conversion'], ['18 min', 'avg response to inquiry'], ['$340k', 'additional revenue / year'],],
    bg: 'from-blue-100 to-cyan-50',
  },
  {
    company: 'RapidFix Group',
    industry: 'Multi-trade',
    location: 'Chicago, IL (HQ) — 3 states',
    size: '47 technicians, 5 locations',
    quote: 'We have 47 technicians across 3 states on the Pro plan. The audit log and per-tenant deploys mean compliance is no longer a fire drill.',
    author: 'Sarah Chen, COO',
    metrics: [['47', 'techs onboarded'], ['SOC 2', 'compliance achieved'], ['99.99%', 'uptime over 14 months']],
    bg: 'from-emerald-100 to-green-50',
  },
  {
    company: 'TidyHome Cleaning',
    industry: 'Cleaning',
    location: 'Portland, OR',
    size: '8 cleaners',
    quote: 'Recurring services + auto-billing transformed our cash flow. We went from chasing invoices to predictable monthly revenue.',
    author: 'Olivia Tran, Founder',
    metrics: [['68%', 'now on recurring plans'], ['$0', 'unpaid invoices'], ['+52%', 'monthly recurring revenue']],
    bg: 'from-pink-100 to-rose-50',
  },
  {
    company: 'GreenLawn Co.',
    industry: 'Landscaping',
    location: 'Atlanta, GA',
    size: '15 crews',
    quote: 'Route optimization alone paid for the platform 3x over. Our crews used to backtrack for hours daily.',
    author: 'Marcus Johnson, Operations Manager',
    metrics: [['2.5 hrs', 'saved per crew per day'], ['$1,800', 'monthly fuel savings'], ['+22%', 'jobs completed per crew']],
    bg: 'from-lime-100 to-emerald-50',
  },
  {
    company: 'Acme Plumbing',
    industry: 'Plumbing',
    location: 'Seattle, WA',
    size: '6 plumbers',
    quote: 'Customer reviews used to require manual follow-up. Now they\'re automatic, and we have 380+ five-star Google reviews.',
    author: 'James Kim, Owner',
    metrics: [['380+', '5-star reviews collected'], ['4.9', 'avg Google rating'], ['#1', 'in local search results']],
    bg: 'from-sky-100 to-blue-50',
  },
];

export default function CustomersPage() {
  return (
    <MarketingLayout>
      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Customer stories</Eyebrow>
          <H2>Real businesses. Real results.</H2>
          <Lead>From solo operators to multi-state franchises, here&apos;s how service businesses use ServiceHub to grow.</Lead>
        </div>
      </Section>

      <Section bg="gray">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {STORIES.map((s) => (
            <article key={s.company} className="rounded-2xl bg-white border border-gray-200 overflow-hidden">
              <div className={`aspect-[16/8] bg-gradient-to-br ${s.bg} flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-900">{s.company}</div>
                  <div className="mt-2 text-sm text-gray-600">{s.industry} · {s.location}</div>
                  <div className="text-sm text-gray-600">{s.size}</div>
                </div>
              </div>
              <div className="p-8">
                <blockquote className="text-gray-700 leading-relaxed italic">"{s.quote}"</blockquote>
                <p className="mt-4 text-sm font-medium text-gray-900">— {s.author}</p>

                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
                  {s.metrics.map(([n, l]) => (
                    <div key={l}>
                      <div className="text-2xl font-bold text-blue-600">{n}</div>
                      <div className="text-xs text-gray-500 mt-1">{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <H2>Want to be next?</H2>
          <Lead className="mx-auto">Start your free trial. We&apos;ll help you migrate. Most businesses are live within 48 hours.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/signup" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Start free trial</Link>
            <Link href="/contact" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">Talk to sales</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

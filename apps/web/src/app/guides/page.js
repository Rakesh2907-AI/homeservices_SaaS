import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Guides — ServiceHub' };

const GUIDES = [
  { time: '10 min', level: 'Beginner',  title: 'Launching your customer portal in under 10 minutes', desc: 'A step-by-step walk through signup, theming, and your first published booking page.', gradient: 'from-blue-500 to-cyan-500' },
  { time: '15 min', level: 'Beginner',  title: 'Designing a pricing structure that scales', desc: 'Flat fees vs hourly vs distance-based — pick the right model and avoid the most common mistakes.', gradient: 'from-emerald-500 to-teal-500' },
  { time: '20 min', level: 'Intermediate', title: 'Setting up commissions for franchises', desc: 'Multi-location? Multi-brand? Here&apos;s how to model the financial split cleanly.', gradient: 'from-violet-500 to-purple-500' },
  { time: '12 min', level: 'Intermediate', title: 'Auto-assigning jobs to the right technician', desc: 'Use skills, geography, and availability to keep dispatchers out of the spreadsheet.', gradient: 'from-amber-500 to-orange-500' },
  { time: '25 min', level: 'Advanced', title: 'Building a custom integration with the API', desc: 'Webhooks, polling, and rate limits — a complete example wiring ServiceHub to QuickBooks.', gradient: 'from-indigo-500 to-blue-500' },
  { time: '30 min', level: 'Advanced', title: 'Migrating from ServiceTitan / Housecall Pro / Jobber', desc: 'CSV templates, common pitfalls, and a checklist to avoid downtime on cutover day.', gradient: 'from-rose-500 to-pink-500' },
];

const LEVEL_STYLES = {
  Beginner: 'bg-emerald-100 text-emerald-700',
  Intermediate: 'bg-amber-100 text-amber-700',
  Advanced: 'bg-rose-100 text-rose-700',
};

export default function GuidesPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Guides</Eyebrow>
            <H2>End-to-end walkthroughs</H2>
            <Lead>Long-form tutorials for going from zero to production. Written by our team and the customers who&apos;ve been there.</Lead>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <Link key={g.title} href="#" className="group rounded-xl overflow-hidden bg-white border border-gray-200 lift">
              <div className={`relative h-32 bg-gradient-to-br ${g.gradient} flex items-end p-6 overflow-hidden`}>
                <div aria-hidden className="absolute inset-0 opacity-20">
                  <div className="absolute top-4 right-4 h-16 w-16 rounded-full border-2 border-white" />
                  <div className="absolute bottom-4 left-8 h-10 w-10 rotate-45 border-2 border-white" />
                </div>
                <div className="relative flex items-center gap-2">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${LEVEL_STYLES[g.level]}`}>{g.level}</span>
                  <span className="text-xs text-white/90 font-medium">{g.time}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition" dangerouslySetInnerHTML={{ __html: g.title }} />
                <p className="text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: g.desc }} />
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 font-medium group-hover:gap-2 transition-all">
                  Read guide <Icon.ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <H2>Have a topic you&apos;d like covered?</H2>
          <Lead className="mx-auto">Email us — if three customers ask for it, we usually write it.</Lead>
          <div className="mt-8">
            <Link href="/contact" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Request a guide</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FloatingShapes } from '@/components/marketing/decorations';
import AnimatedCounter from '@/components/marketing/AnimatedCounter';
import { Icon } from '@/components/marketing/icons';

export const metadata = {
  title: 'About — ServiceHub',
  description: 'The story behind ServiceHub and the people building it.',
};

const VALUES = [
  {
    title: 'Customer-obsessed',
    desc: 'We talk to service-business owners every week. If we can&apos;t hear three customers ask for it, we don&apos;t build it.',
  },
  {
    title: 'Data over opinions',
    desc: 'Every feature ships with metrics. If the metric moves, we keep it. If not, we cut it.',
  },
  {
    title: 'Default to transparency',
    desc: 'Public roadmap. Public changelog. Public incident reports. Public pricing — no "talk to sales" for anything under $500/mo.',
  },
  {
    title: 'Security is non-negotiable',
    desc: 'Database-level isolation, SOC 2 Type II, encrypted at rest and in transit. We obsess about this so you don&apos;t have to.',
  },
  {
    title: 'Build for the field',
    desc: 'Our team rides along with technicians, sits with dispatchers, and watches business owners use the product. Software designed in an office tower doesn&apos;t survive contact with a job site.',
  },
  {
    title: 'Long-term thinking',
    desc: 'We&apos;re profitable, bootstrapped, and plan to be here for the next 30 years. No artificial growth pressure means we can prioritize what matters: building software you love using.',
  },
];

const TIMELINE = [
  ['2021', 'Founded in Portland, OR after our co-founder Maya spent 8 months helping her family&apos;s plumbing business migrate off paper schedules.'],
  ['2022', 'First 100 paying customers. Raised a small seed round, then bought it back 18 months later when we realized we didn&apos;t need outside money.'],
  ['2023', 'Launched the multi-tenant architecture rebuild — moved from a single shared DB to RLS + per-tenant Kubernetes namespaces.'],
  ['2024', 'SOC 2 Type II certified. Crossed 5,000 active businesses. Opened a Toronto engineering office.'],
  ['2025', 'Launched per-tenant feature flags and GitOps deployments. Profitable, growing 8% MoM, 47 employees, 0 outside investors.'],
];

const FACTS = [
  ['47', 'employees'],
  ['10,000+', 'businesses'],
  ['$28M', 'annual revenue run-rate'],
  ['100%', 'employee-owned'],
];

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <FloatingShapes />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>About us</Eyebrow>
            <H2>We&apos;re building the tools we wish we&apos;d had.</H2>
            <Lead>
              ServiceHub was started in 2021 by three engineers who watched a family plumbing business
              run on paper, sticky notes, and a 12-year-old Access database. We figured: surely there&apos;s
              something better. There wasn&apos;t. So we built it.
            </Lead>
          </div>
        </Section>
      </section>

      {/* MISSION */}
      <Section bg="gray">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Eyebrow>Our mission</Eyebrow>
            <H2>Make great software accessible to the businesses that keep our homes running.</H2>
          </div>
          <div className="text-gray-700 space-y-4 leading-relaxed">
            <p>
              Plumbers, electricians, HVAC techs, cleaners, landscapers — these are the people who keep
              modern life functioning. They deserve software that&apos;s as good as what tech companies
              build for themselves.
            </p>
            <p>
              For too long, the tools available to service businesses have been either grossly overpriced
              enterprise systems or barely-functional cheap apps. ServiceHub exists to change that — one
              business at a time.
            </p>
            <p>
              We measure success not by how many customers we have, but by how many businesses grew because
              of us. The number is bigger than we expected.
            </p>
          </div>
        </div>
      </Section>

      {/* VALUES */}
      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>What we believe</Eyebrow>
          <H2>Our values</H2>
          <Lead>These aren&apos;t poster slogans. They&apos;re what we use to make decisions when no one is looking.</Lead>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {VALUES.map((v, i) => (
            <div key={v.title} className="group relative rounded-xl border border-gray-200 p-6 lift overflow-hidden">
              <div aria-hidden className="absolute top-0 right-0 text-7xl font-bold text-gray-50 group-hover:text-blue-50 transition-colors leading-none -mr-2 -mt-2 select-none">{(i + 1).toString().padStart(2, '0')}</div>
              <div className="relative">
                <h3 className="font-semibold text-gray-900 mb-2">{v.title}</h3>
                <p className="text-gray-600">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TIMELINE */}
      <section className="relative bg-gray-50 overflow-hidden">
        <DotGrid className="opacity-40" />
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-24">
          <div className="max-w-3xl mb-12">
            <Eyebrow>Our story</Eyebrow>
            <H2>Where we&apos;ve been</H2>
          </div>
          <div className="relative max-w-3xl">
            {/* Connecting line */}
            <div aria-hidden className="absolute left-[5.5rem] md:left-[8.5rem] top-2 bottom-2 w-px bg-gradient-to-b from-blue-500 via-cyan-400 to-blue-200" />

            <div className="space-y-12">
              {TIMELINE.map(([year, desc], i) => (
                <div key={year} className="relative flex gap-6 md:gap-12 group">
                  <div className="w-20 md:w-32 flex-shrink-0 text-right">
                    <span className="text-3xl md:text-4xl font-bold gradient-text">{year}</span>
                  </div>
                  <div className="relative flex-1">
                    {/* Node dot */}
                    <span aria-hidden className="absolute -left-[1.5rem] md:-left-[1.55rem] top-2 h-4 w-4 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 ring-4 ring-gray-50 shadow group-hover:scale-125 transition-transform" />
                    <p className="text-gray-700 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FACTS */}
      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>By the numbers</Eyebrow>
          <H2>Where we are today</H2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {FACTS.map(([n, l]) => (
            <div key={l} className="rounded-xl border border-gray-200 p-6 lift">
              <div className="text-5xl font-bold gradient-text"><AnimatedCounter value={n} /></div>
              <div className="mt-2 text-sm text-gray-600">{l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section bg="gray">
        <div className="text-center">
          <H2>Want to meet the team?</H2>
          <Lead className="mx-auto">Get to know the people building ServiceHub.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/team" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Meet the team</Link>
            <Link href="/careers" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">We&apos;re hiring</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

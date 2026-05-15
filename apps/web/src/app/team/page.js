import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';

export const metadata = {
  title: 'Team — ServiceHub',
  description: 'The people building ServiceHub.',
};

const LEADERSHIP = [
  {
    name: 'Maya Patel',
    role: 'CEO & Co-founder',
    bio: 'Former staff engineer at Stripe. Started ServiceHub after helping her family&apos;s 3rd-generation plumbing business modernize. Computer science from Carnegie Mellon.',
    location: 'Portland, OR',
    avatar: 'MP',
    gradient: 'from-blue-500 to-purple-500',
  },
  {
    name: 'Diego Alvarez',
    role: 'CTO & Co-founder',
    bio: 'Built infrastructure at Shopify and Vercel. Obsessed with multi-tenant databases and developer experience. Believes you can have both speed and safety.',
    location: 'Toronto, ON',
    avatar: 'DA',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Sarah Chen',
    role: 'COO & Co-founder',
    bio: 'Ran ops for a 40-person field-services company before joining. Knows what dispatchers actually need, because she was one for 6 years.',
    location: 'Portland, OR',
    avatar: 'SC',
    gradient: 'from-pink-500 to-orange-500',
  },
];

const TEAM = [
  { name: 'Aisha Rahman', role: 'VP of Engineering', avatar: 'AR', gradient: 'from-green-500 to-teal-500' },
  { name: 'Marcus Johnson', role: 'VP of Sales', avatar: 'MJ', gradient: 'from-amber-500 to-red-500' },
  { name: 'Yuki Tanaka', role: 'Head of Design', avatar: 'YT', gradient: 'from-purple-500 to-pink-500' },
  { name: 'Ravi Krishnan', role: 'Head of Customer Success', avatar: 'RK', gradient: 'from-blue-500 to-indigo-500' },
  { name: 'Elena Volkov', role: 'Head of Security', avatar: 'EV', gradient: 'from-rose-500 to-red-500' },
  { name: 'Tom O\'Brien', role: 'Head of Finance', avatar: 'TO', gradient: 'from-emerald-500 to-cyan-500' },
  { name: 'Priya Iyer', role: 'Principal Engineer, Platform', avatar: 'PI', gradient: 'from-violet-500 to-blue-500' },
  { name: 'Carlos Mendes', role: 'Principal Engineer, Frontend', avatar: 'CM', gradient: 'from-lime-500 to-emerald-500' },
  { name: 'Jamal Williams', role: 'Engineering Manager, Booking', avatar: 'JW', gradient: 'from-sky-500 to-blue-500' },
  { name: 'Nina Kowalski', role: 'Engineering Manager, Pricing', avatar: 'NK', gradient: 'from-fuchsia-500 to-pink-500' },
  { name: 'Daniel Park', role: 'Product Manager', avatar: 'DP', gradient: 'from-orange-500 to-yellow-500' },
  { name: 'Lisa Tanaka', role: 'Product Manager', avatar: 'LT', gradient: 'from-cyan-500 to-emerald-500' },
];

const ADVISORS = [
  { name: 'Dr. Naomi Williamson', role: 'Former CTO, ServiceTitan', specialty: 'Field service operations' },
  { name: 'Greg Martinez', role: 'Founder, BlueCollar Capital', specialty: 'Service business M&A' },
  { name: 'Hannah Okafor', role: 'Partner, Bessemer Venture Partners (observer)', specialty: 'Vertical SaaS' },
];

function Avatar({ avatar, gradient, size = 'lg' }) {
  const sizes = { lg: 'h-24 w-24 text-2xl', md: 'h-16 w-16 text-lg' };
  return (
    <div className={`${sizes[size]} rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}>
      {avatar}
    </div>
  );
}

export default function TeamPage() {
  return (
    <MarketingLayout>
      {/* HERO */}
      <Section>
        <div className="max-w-3xl">
          <Eyebrow>Team</Eyebrow>
          <H2>The people behind ServiceHub</H2>
          <Lead>
            47 humans across Portland, Toronto, and remotely from a dozen countries.
            Engineers, designers, support folks, and former service-business operators.
            We&apos;re building software for people we know.
          </Lead>
        </div>
      </Section>

      {/* LEADERSHIP */}
      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Founders</Eyebrow>
          <H2>Started by three friends who got tired of bad software</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LEADERSHIP.map((m) => (
            <div key={m.name} className="rounded-xl border border-gray-200 bg-white p-8">
              <Avatar avatar={m.avatar} gradient={m.gradient} size="lg" />
              <h3 className="mt-6 text-xl font-bold text-gray-900">{m.name}</h3>
              <p className="text-sm text-blue-600 font-medium">{m.role}</p>
              <p className="text-xs text-gray-500 mt-1">{m.location}</p>
              <p className="mt-4 text-sm text-gray-600 leading-relaxed">{m.bio}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* LEADERSHIP TEAM */}
      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>Leadership team</Eyebrow>
          <H2>Department leaders</H2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {TEAM.map((m) => (
            <div key={m.name} className="text-center">
              <div className="flex justify-center">
                <Avatar avatar={m.avatar} gradient={m.gradient} size="md" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">{m.name}</h3>
              <p className="text-xs text-gray-500">{m.role}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ADVISORS */}
      <Section bg="gray">
        <div className="max-w-3xl mb-12">
          <Eyebrow>Advisors</Eyebrow>
          <H2>People we lean on</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ADVISORS.map((a) => (
            <div key={a.name} className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">{a.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{a.role}</p>
              <p className="text-xs text-blue-600 mt-2">{a.specialty}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* CULTURE */}
      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Eyebrow>Culture</Eyebrow>
            <H2>How we work</H2>
          </div>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p><strong className="text-gray-900">Remote-first, async by default.</strong> Most work happens in writing — better decisions, fewer meetings.</p>
            <p><strong className="text-gray-900">4-day work week.</strong> We work Monday through Thursday. Friday is yours.</p>
            <p><strong className="text-gray-900">Ride-along program.</strong> Every employee spends 2 days per year with a customer&apos;s technician team in the field. Yes, the engineers too.</p>
            <p><strong className="text-gray-900">No-meeting Tuesdays + Thursdays.</strong> Deep work happens when calendars stay empty.</p>
            <p><strong className="text-gray-900">Profit sharing.</strong> Every employee receives quarterly profit-share distributions on top of salary.</p>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section bg="gray">
        <div className="text-center">
          <H2>Want to join us?</H2>
          <Lead className="mx-auto">We&apos;re hiring across engineering, design, sales, and customer success.</Lead>
          <div className="mt-8">
            <Link href="/careers" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">See open roles</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

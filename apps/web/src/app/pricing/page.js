'use client';
import { useState } from 'react';
import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';

const TIERS = [
  {
    name: 'Basic',
    description: 'Solo operators and small crews getting started.',
    monthly: 29,
    annual: 24,
    cta: 'Start free trial',
    features: [
      'Up to 5 staff members',
      'Unlimited bookings',
      'Branded customer portal',
      'Online payments (Stripe)',
      'Email + SMS notifications',
      '14-day free trial',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    description: 'Growing businesses with multiple technicians and locations.',
    monthly: 99,
    annual: 79,
    cta: 'Start free trial',
    features: [
      'Up to 25 staff members',
      'Everything in Basic',
      'Custom domain (yourbiz.com)',
      'Advanced analytics & reports',
      'Multi-location support',
      'Recurring services + auto-billing',
      'Commission structures',
      'Priority email support',
    ],
    popular: true,
  },
  {
    name: 'Enterprise',
    description: 'Multi-state operators and franchise systems.',
    monthly: 499,
    annual: 399,
    cta: 'Contact sales',
    features: [
      'Unlimited staff',
      'Everything in Pro',
      'Dedicated database (data residency)',
      'Custom SLA + 99.99% uptime',
      'SSO / SAML',
      'Audit log exports',
      'Dedicated success manager',
      'Onboarding & migration assistance',
    ],
    popular: false,
  },
];

const COMPARE = [
  ['Branded customer portal', '✓', '✓', '✓'],
  ['Subdomain (yourbiz.servicehub.app)', '✓', '✓', '✓'],
  ['Custom domain', '—', '✓', '✓'],
  ['Staff members', 'Up to 5', 'Up to 25', 'Unlimited'],
  ['Locations', '1', 'Up to 5', 'Unlimited'],
  ['Bookings / month', 'Unlimited', 'Unlimited', 'Unlimited'],
  ['Online payments', '✓', '✓', '✓'],
  ['Recurring services', '—', '✓', '✓'],
  ['Commission structures', '—', '✓', '✓'],
  ['Analytics dashboard', 'Basic', 'Advanced', 'Advanced + custom'],
  ['API access', '—', '✓', '✓'],
  ['Webhooks', '—', '✓', '✓'],
  ['Dedicated database', '—', '—', '✓'],
  ['SSO / SAML', '—', '—', '✓'],
  ['Audit log retention', '30 days', '1 year', '7 years'],
  ['Uptime SLA', '99.9%', '99.95%', '99.99%'],
  ['Support', 'Email', 'Priority email', 'Dedicated CSM'],
];

const FAQS = [
  ['Is there a free trial?', 'Yes — every plan starts with a 14-day free trial. No credit card required. You can cancel any time during the trial without being charged.'],
  ['Can I change plans later?', 'Absolutely. Upgrade or downgrade from your dashboard — changes prorate automatically.'],
  ['Do you charge transaction fees?', 'No. ServiceHub does not take a cut of your bookings. You only pay the monthly subscription. Standard Stripe processing fees (2.9% + 30¢) apply to card payments — those go directly to Stripe.'],
  ['What happens to my data if I cancel?', 'You own your data. We retain it for 30 days after cancellation in case you change your mind, then it&apos;s permanently deleted. You can export everything as CSV or via API at any time.'],
  ['Do you offer discounts for annual billing?', 'Yes — pay annually and save ~20%. Pricing toggles above show both.'],
  ['Is my data secure?', 'Yes. Row-level security ensures business data is isolated at the database level. We&apos;re SOC 2 Type II compliant. Enterprise customers get a dedicated database for full physical isolation.'],
  ['Can I migrate from another tool?', 'Enterprise plans include free migration. For Basic and Pro, we provide CSV import templates and migration guides. Most businesses are live within a day.'],
  ['Do you offer non-profit or franchise pricing?', 'Yes — contact our sales team for non-profit discounts and franchise rollout pricing.'],
];

export default function PricingPage() {
  const [billing, setBilling] = useState('monthly');
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <MarketingLayout>
      {/* HERO + TOGGLE */}
      <Section>
        <div className="text-center max-w-3xl mx-auto">
          <Eyebrow>Pricing</Eyebrow>
          <H2 className="mx-auto">Simple, transparent pricing</H2>
          <Lead className="mx-auto">Pick a plan. Cancel anytime. No transaction fees. No hidden costs.</Lead>

          <div className="mt-10 inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === 'monthly' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${billing === 'annual' ? 'bg-white shadow text-gray-900' : 'text-gray-600'}`}
            >
              Annual <span className="text-green-600 ml-1">(save 20%)</span>
            </button>
          </div>
        </div>

        {/* TIER CARDS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`relative rounded-2xl border bg-white p-8 ${t.popular ? 'border-gray-900 shadow-lg md:scale-105' : 'border-gray-200'}`}
            >
              {t.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gray-900 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{t.name}</h3>
              <p className="mt-2 text-sm text-gray-600 min-h-[40px]">{t.description}</p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">${billing === 'monthly' ? t.monthly : t.annual}</span>
                <span className="text-gray-500 ml-1">/mo</span>
                {billing === 'annual' && <p className="text-xs text-gray-500 mt-1">Billed annually as ${t.annual * 12}</p>}
              </div>
              <Link
                href={t.cta === 'Contact sales' ? '/contact' : '/signup'}
                className={`mt-8 block w-full text-center rounded-md px-4 py-3 text-sm font-medium transition ${
                  t.popular ? 'bg-gray-900 text-white hover:bg-gray-800' : 'border border-gray-300 text-gray-900 hover:border-gray-400'
                }`}
              >
                {t.cta}
              </Link>
              <ul className="mt-8 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-gray-700">
                    <svg className="h-5 w-5 flex-shrink-0 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* COMPARISON TABLE */}
      <Section bg="gray">
        <div className="max-w-3xl mb-10">
          <Eyebrow>Compare plans</Eyebrow>
          <H2>Every feature side-by-side</H2>
        </div>
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-semibold">Feature</th>
                <th className="p-4 font-semibold">Basic</th>
                <th className="p-4 font-semibold bg-gray-50">Pro</th>
                <th className="p-4 font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map(([feature, b, p, e], i) => (
                <tr key={feature} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-4 text-gray-700">{feature}</td>
                  <td className="p-4 text-center text-gray-700">{b}</td>
                  <td className="p-4 text-center text-gray-700 bg-gray-50">{p}</td>
                  <td className="p-4 text-center text-gray-700">{e}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Eyebrow>FAQ</Eyebrow>
            <H2 className="mx-auto">Frequently asked questions</H2>
          </div>
          <div className="space-y-3">
            {FAQS.map(([q, a], i) => (
              <div key={q} className="border border-gray-200 rounded-lg bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-gray-900">{q}</span>
                  <svg className={`h-5 w-5 text-gray-400 transition ${openFaq === i ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed">{a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section bg="gray">
        <div className="text-center">
          <H2>Still have questions?</H2>
          <Lead className="mx-auto">Our team is happy to walk you through anything.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/contact" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Contact sales</Link>
            <Link href="/signup" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">Start free trial</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

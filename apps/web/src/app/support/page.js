import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FeatureIcon } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Support — ServiceHub' };

const TOPICS = [
  { Ico: Icon.Bolt, gradient: 'from-blue-500 to-cyan-500', title: 'Getting started', count: 18 },
  { Ico: Icon.Calendar, gradient: 'from-violet-500 to-purple-500', title: 'Bookings & scheduling', count: 24 },
  { Ico: Icon.Dollar, gradient: 'from-emerald-500 to-teal-500', title: 'Billing & invoices', count: 16 },
  { Ico: Icon.Palette, gradient: 'from-amber-500 to-orange-500', title: 'Branding & themes', count: 12 },
  { Ico: Icon.Shield, gradient: 'from-rose-500 to-pink-500', title: 'Account & security', count: 14 },
  { Ico: Icon.Code, gradient: 'from-indigo-500 to-blue-500', title: 'API & integrations', count: 21 },
];

const FAQS = [
  ['How do I add a new staff member?', 'From your dashboard, go to Settings → Team. Click "Invite member", enter their email, choose a role (staff or business_admin), and they&apos;ll get an invite by email.'],
  ['Why isn&apos;t my custom domain working?', 'Custom domains require a CNAME record pointing yourbiz.com to portal.servicehub.app. After updating DNS, SSL provisioning takes 5–10 minutes. Check Settings → Domain for the exact instructions.'],
  ['How do I export my data?', 'Settings → Data export. Choose what to include (bookings, customers, invoices) and a date range. We&apos;ll email you a CSV (or JSON) within a few minutes. The link is valid for 7 days.'],
  ['Can I undo a deleted booking?', 'Yes. We soft-delete for 30 days. Go to Bookings → filter by "Cancelled". Re-open the booking and click Restore.'],
  ['What happens if a customer disputes a charge?', 'You&apos;ll get a Slack/email alert from Stripe. ServiceHub automatically attaches the booking record, technician notes, and photos to help you respond. We&apos;ve documented the full flow in the Billing docs.'],
  ['How do I add a new pricing rule?', 'Open the service in your dashboard. In the Pricing tab, click "Add rule". Pick a type (flat, hourly, distance, sqft), set the rate, and save. Rules can have time windows for seasonal pricing.'],
];

export default function SupportPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>Support center</Eyebrow>
            <H2 className="mx-auto">How can we help?</H2>
            <Lead className="mx-auto">Browse common topics, search our knowledge base, or talk to a human.</Lead>
            <div className="mt-8 max-w-xl mx-auto relative">
              <input
                type="search"
                placeholder="Describe your issue or ask a question…"
                className="w-full rounded-lg border border-gray-300 bg-white px-5 py-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Section>
      </section>

      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>Topics</Eyebrow>
          <H2>Browse by category</H2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {TOPICS.map((t) => (
            <Link key={t.title} href="#" className="rounded-xl border border-gray-200 p-6 lift group">
              <FeatureIcon gradient={t.gradient}>
                <t.Ico className="h-6 w-6" />
              </FeatureIcon>
              <h3 className="mt-4 font-semibold text-gray-900 group-hover:text-blue-600 transition">{t.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{t.count} articles</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section bg="gray">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Eyebrow>Common questions</Eyebrow>
            <H2 className="mx-auto">FAQs</H2>
          </div>
          <div className="space-y-3">
            {FAQS.map(([q, a]) => (
              <details key={q} className="group rounded-lg border border-gray-200 bg-white">
                <summary className="cursor-pointer flex items-center justify-between p-5 font-medium text-gray-900 list-none">
                  <span dangerouslySetInnerHTML={{ __html: q }} />
                  <Icon.ArrowRight className="h-5 w-5 text-gray-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: a }} />
              </details>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { Ico: Icon.MessageCircle, title: 'Live chat',  desc: 'Available 9am–6pm PT, Mon–Fri.', cta: 'Start chat', gradient: 'from-blue-500 to-cyan-500' },
            { Ico: Icon.Mail, title: 'Email support', desc: 'support@servicehub.app · replies under 2 hr.', cta: 'Send email', gradient: 'from-emerald-500 to-teal-500' },
            { Ico: Icon.Phone, title: 'Pro & Enterprise', desc: 'Phone support on paid plans. +1 (555) 010-2030.', cta: 'Call us', gradient: 'from-violet-500 to-purple-500' },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-gray-200 p-6 lift">
              <FeatureIcon gradient={c.gradient}>
                <c.Ico className="h-6 w-6" />
              </FeatureIcon>
              <h3 className="mt-4 font-semibold text-gray-900">{c.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
              <Link href="/contact" className="mt-3 inline-block text-sm text-blue-600 font-medium link-underline">{c.cta}</Link>
            </div>
          ))}
        </div>
      </Section>
    </MarketingLayout>
  );
}

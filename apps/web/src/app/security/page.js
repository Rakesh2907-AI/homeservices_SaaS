import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FeatureIcon } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Security — ServiceHub' };

const PILLARS = [
  { Ico: Icon.Shield, gradient: 'from-blue-500 to-cyan-500', title: 'Data isolation at the database layer', desc: 'Every tenant-scoped query is filtered by PostgreSQL Row-Level Security. Even if a developer forgets a WHERE clause, the database refuses to return cross-tenant data.' },
  { Ico: Icon.Lock,   gradient: 'from-rose-500 to-pink-500', title: 'Encryption everywhere', desc: 'All data is encrypted at rest using AES-256 and in transit using TLS 1.3. Database connections are forced TLS. Backups are encrypted with separate keys.' },
  { Ico: Icon.Layers, gradient: 'from-violet-500 to-purple-500', title: 'Defense in depth', desc: 'Network policies block lateral movement between tenant namespaces in Kubernetes. WAF blocks common attack patterns. Per-tenant rate limiting prevents abuse.' },
  { Ico: Icon.Globe,  gradient: 'from-emerald-500 to-teal-500', title: 'Geographic redundancy', desc: 'Multi-AZ failover for both database and cache. Daily encrypted backups stored in a separate region. RPO under 5 minutes, RTO under 30 minutes.' },
  { Ico: Icon.Check,  gradient: 'from-amber-500 to-orange-500', title: 'Independent audits', desc: 'SOC 2 Type II certified. Annual penetration tests by an independent third party. Quarterly internal security reviews. Reports available under NDA.' },
  { Ico: Icon.Zap,    gradient: 'from-indigo-500 to-blue-500', title: 'Incident response', desc: '24/7 on-call rotation. Public post-mortems for any incident with customer impact. Automated audit logs of every privileged action retained for 7 years.' },
];

const COMPLIANCE = [
  { name: 'SOC 2 Type II',    desc: 'Annual audit covering Security, Availability, and Confidentiality.' },
  { name: 'GDPR',             desc: 'EU data subject rights, DPA available, EU sub-processors listed.' },
  { name: 'CCPA',             desc: 'California consumer privacy rights honored end-to-end.' },
  { name: 'HIPAA-ready (Enterprise)', desc: 'BAAs available for Enterprise customers handling PHI.' },
  { name: 'PCI DSS SAQ A',    desc: 'Card data flows directly to Stripe — we never store PANs.' },
  { name: 'ISO 27001 (in progress)', desc: 'Targeting certification in Q4 2026.' },
];

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Security</Eyebrow>
            <H2>How we keep your business data safe</H2>
            <Lead>Multi-tenant security isn&apos;t a feature — it&apos;s the foundation. Here&apos;s exactly what we do to keep your data isolated, encrypted, and audited.</Lead>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PILLARS.map((p) => (
            <div key={p.title} className="rounded-xl bg-white border border-gray-200 p-6 lift">
              <FeatureIcon gradient={p.gradient}>
                <p.Ico className="h-6 w-6" />
              </FeatureIcon>
              <h3 className="mt-4 font-semibold text-gray-900">{p.title}</h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>Compliance</Eyebrow>
          <H2>Frameworks we&apos;re certified under</H2>
          <Lead>Audit reports and questionnaires (SIG, CAIQ) available under NDA.</Lead>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMPLIANCE.map((c) => (
            <div key={c.name} className="rounded-lg border border-gray-200 p-5 flex gap-4 lift">
              <Icon.Check className="h-6 w-6 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-gray-900">{c.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section bg="gray">
        <div className="max-w-3xl mx-auto rounded-2xl border border-gray-200 bg-white p-8">
          <Icon.Mail className="h-8 w-8 text-blue-600" />
          <h3 className="mt-4 text-xl font-bold text-gray-900">Reporting a vulnerability</h3>
          <p className="mt-3 text-gray-700 leading-relaxed">
            We take security reports seriously. If you&apos;ve discovered a vulnerability, please report it privately
            to <strong>security@servicehub.app</strong>. We acknowledge every report within 24 hours, ship fixes
            quickly, and publicly credit researchers who help us improve.
          </p>
          <p className="mt-4 text-sm text-gray-500">PGP fingerprint: <code className="font-mono">4A3B 2C1D 8E9F 7A6B 5C4D 3E2F 1A0B 9C8D 7E6F 5A4B</code></p>
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <H2>Have a security question?</H2>
          <Lead className="mx-auto">Our security team will help.</Lead>
          <div className="mt-8 flex gap-3 justify-center">
            <Link href="/contact" className="rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white hover:bg-gray-800">Contact security</Link>
            <Link href="/dpa" className="rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">View our DPA</Link>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

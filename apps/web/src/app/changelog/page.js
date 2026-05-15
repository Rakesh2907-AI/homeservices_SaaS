import Link from 'next/link';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

export const metadata = { title: 'Changelog — ServiceHub' };

const RELEASES = [
  {
    version: '2.4.0',
    date: '2026-05-12',
    tag: 'Feature',
    title: 'Per-tenant feature flags via Unleash',
    notes: [
      'Toggle features on / off scoped to specific tenant IDs',
      'Beta-rollout to 5% / 10% / 25% of tenants by plan tier',
      'New /api/v1/feature-flags endpoints',
    ],
  },
  {
    version: '2.3.7',
    date: '2026-05-03',
    tag: 'Improvement',
    title: 'Faster booking-search index',
    notes: [
      'Added composite GIN index on (tenant_id, customer_id, scheduled_at)',
      'Average booking-list query latency dropped from 38 ms → 9 ms',
    ],
  },
  {
    version: '2.3.6',
    date: '2026-04-22',
    tag: 'Fix',
    title: 'Logo upload edge cases',
    notes: [
      'Fixed silent failure when uploading SVG files larger than 1 MB',
      'Better error messages for unsupported mime types',
    ],
  },
  {
    version: '2.3.0',
    date: '2026-04-10',
    tag: 'Feature',
    title: 'Commission structures',
    notes: [
      'New commission_structures table — percent or flat fee, scoped to platform / staff / category / service',
      'Bulk create endpoint for migrating existing rules',
      'UI in onboarding wizard step 5',
    ],
  },
  {
    version: '2.2.0',
    date: '2026-03-28',
    tag: 'Feature',
    title: 'Onboarding wizard',
    notes: [
      '5-step setup: theme & logo → business details → categories → services → commissions',
      'Resumable mid-wizard',
      '6 curated theme presets with live preview',
    ],
  },
  {
    version: '2.1.0',
    date: '2026-03-05',
    tag: 'Security',
    title: 'PostgreSQL Row-Level Security on every tenant-scoped table',
    notes: [
      'FORCE ROW LEVEL SECURITY enforced — even table owners obey policies',
      'New synthetic-tenant CI test asserts cross-tenant queries return zero rows',
      'Split saas_user (non-superuser) and migration roles',
    ],
  },
  {
    version: '2.0.0',
    date: '2026-02-14',
    tag: 'Breaking',
    title: 'Multi-tenant rebuild',
    notes: [
      'Migrated from single shared schema to RLS-protected pool model',
      'Hash-partitioned bookings & audit_logs into 8 partitions',
      'New x-tenant-slug header for cross-origin browser apps',
    ],
  },
];

const TAG_STYLES = {
  Feature:     'bg-blue-100 text-blue-700',
  Improvement: 'bg-emerald-100 text-emerald-700',
  Fix:         'bg-amber-100 text-amber-700',
  Security:    'bg-rose-100 text-rose-700',
  Breaking:    'bg-violet-100 text-violet-700',
};

export default function ChangelogPage() {
  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="max-w-3xl">
            <Eyebrow>Changelog</Eyebrow>
            <H2>What&apos;s new in ServiceHub</H2>
            <Lead>Every release, every fix, every feature. Updated whenever something ships.</Lead>
            <p className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-green-500" />
              All systems operational · <Link href="/status" className="underline">view status</Link>
            </p>
          </div>
        </Section>
      </section>

      <Section bg="gray">
        <div className="relative max-w-3xl mx-auto">
          <div aria-hidden className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-blue-500 via-cyan-400 to-blue-200" />

          <div className="space-y-12">
            {RELEASES.map((r) => (
              <article key={r.version} className="relative pl-12">
                <span aria-hidden className="absolute left-0 top-1.5 h-7 w-7 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center shadow">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                </span>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="font-mono text-sm font-bold text-gray-900">v{r.version}</span>
                  <span className="text-xs text-gray-500">{new Date(r.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${TAG_STYLES[r.tag] || 'bg-gray-100 text-gray-700'}`}>{r.tag}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{r.title}</h3>
                <ul className="space-y-2">
                  {r.notes.map((n) => (
                    <li key={n} className="flex gap-2 text-sm text-gray-700">
                      <Icon.Check className="flex-shrink-0 h-5 w-5 text-blue-600" />
                      <span>{n}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <div className="text-center">
          <H2>Want the full history?</H2>
          <Lead className="mx-auto">Full release notes including patch-level changes are on our public GitHub.</Lead>
          <div className="mt-8">
            <a href="https://github.com/Rakesh2907-AI/homeservices_SaaS/releases" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-6 py-3 text-base font-medium text-gray-700 hover:border-gray-400">
              <Icon.Code className="h-4 w-4" /> View on GitHub
            </a>
          </div>
        </div>
      </Section>
    </MarketingLayout>
  );
}

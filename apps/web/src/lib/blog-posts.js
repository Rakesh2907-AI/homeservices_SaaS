/**
 * Blog content. In production this would be MDX files or a CMS — keeping it
 * as JS for simplicity so the marketing site has zero external dependencies.
 */
export const POSTS = [
  {
    slug: 'why-multi-tenant-rls',
    title: 'Why we bet the company on PostgreSQL Row-Level Security',
    excerpt: 'When we rebuilt our multi-tenant architecture in 2023, we had to choose between three isolation models. Here\'s why we picked the one that scares most teams.',
    author: 'Diego Alvarez',
    authorRole: 'CTO',
    date: '2025-04-22',
    readTime: '8 min read',
    category: 'Engineering',
    tags: ['architecture', 'postgres', 'security'],
    body: `
When you serve thousands of businesses on the same infrastructure, the question isn't whether you'll have a data leak — it's whether your architecture makes it inevitable.

## The three models

Every multi-tenant SaaS chooses one of three architectures:

1. **Silo** — a dedicated database per tenant. Maximum isolation, maximum cost.
2. **Bridge** — one database, one schema per tenant. Logical isolation, moderate cost.
3. **Pool** — one database, one schema, rows tagged by \`tenant_id\`. Best resource utilization, terrifying if you get it wrong.

We chose pool. With Row-Level Security as the safety net.

## What RLS gives you

Row-Level Security is a Postgres feature that lets you attach a policy to a table. Every query — \`SELECT\`, \`INSERT\`, \`UPDATE\`, \`DELETE\` — gets an automatic \`WHERE\` clause appended at the database engine level. Forget the filter in your application code? The database refuses to return data anyway.

\`\`\`sql
CREATE POLICY tenant_isolation ON bookings
  USING (tenant_id::text = current_setting('app.current_tenant'));

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings FORCE ROW LEVEL SECURITY;
\`\`\`

That \`FORCE\` is crucial. Without it, the table owner — usually your migration role — can bypass the policy. With it, *everyone* obeys.

## The trap that almost killed us

In our first deployment we got bitten by a subtle Postgres rule: **superusers bypass RLS unconditionally**. Even with FORCE. Even with explicit policies.

Our migration role was a superuser. Our app role was the same role (we hadn't separated them yet). So when we ran the tests we'd carefully written for RLS isolation, they all passed — because every test ran as a superuser and saw everything.

We only caught it when a customer's QA engineer noticed they could query competitor data. We had 4 hours of exposure. No one had actually queried anything they shouldn't. We were lucky.

## What we do now

1. **Two roles, always.** A migration role with SUPERUSER for schema changes and a separate app role with no special privileges.
2. **\`FORCE\` on every tenant-scoped table.** No exceptions. We have a CI check that fails the build if a migration adds a tenant-scoped table without enabling FORCE RLS.
3. **A "synthetic tenant" test in CI.** We seed two tenants, then assert that tenant A's queries return zero of tenant B's rows. Across every table. Every commit.
4. **Connection pool gotcha awareness.** RLS context is set on the *session*. If you reuse a pooled connection without resetting context, you leak. We use \`SET LOCAL ... = ...\` inside a transaction, which auto-resets on commit.

## What we'd do differently

Honestly, we'd still pick Pool with RLS. The cost savings versus Silo are 30-50x. The operational simplicity versus Bridge is significant. But we'd have written the synthetic-tenant test on day one, before our first production deploy.

If you're building a multi-tenant SaaS, write that test first. Everything else is debatable.
    `,
  },
  {
    slug: 'pricing-rules-for-home-services',
    title: 'How to design a pricing engine that doesn\'t break when your business does',
    excerpt: 'Most service businesses outgrow their pricing tool within 18 months. Here\'s a framework for designing one that scales from solo operator to multi-state franchise.',
    author: 'Sarah Chen',
    authorRole: 'COO',
    date: '2025-03-15',
    readTime: '6 min read',
    category: 'Operations',
    tags: ['pricing', 'business'],
    body: `
The first version of any pricing system is "$X per service." It works until it doesn't.

Within a year, most service businesses are juggling:

- Flat fees for standard jobs
- Hourly rates for diagnostic work
- Distance surcharges for outside the service area
- Member discounts
- Seasonal pricing (snow removal in January costs more than September)
- Square-footage scaling for cleaning
- After-hours premiums

If your tool only supports flat-fee pricing, you're either undercharging or losing time to manual override.

## The model we use

After watching hundreds of service businesses, here's the structure that holds up:

**Service** — the thing being sold. "Standard drain unclog."

**Pricing rule** — one or more rules attached to a service. Each rule has:
- A \`rule_type\` (flat, hourly, distance, sqft, tiered)
- A \`rate\` (the number)
- A \`config\` (rule-specific JSON — min hours, max travel radius, etc.)
- An \`effective_from\` / \`effective_to\` window (for seasonal pricing)

**Modifier** — applied to the calculated price. Discount codes, member status, after-hours flag.

**Quote** — the resolved price at a moment in time, with all rules and modifiers stored alongside. Even if you change pricing tomorrow, last week's quotes stay reproducible.

## Why this works

Three reasons:

1. **It's auditable.** Customer asks why their bill was $237. You can show them: $180 flat fee + $30 after-hours + $27 distance surcharge. No black box.

2. **It survives reorganization.** Adding a new pricing model — say, equipment-rental fees — means adding a new rule type, not rewriting your billing system.

3. **It's testable.** Each rule type is a pure function: \`(service, context) → number\`. You can unit-test it. You should unit-test it.

## What we'd warn against

**Don't put pricing logic in the database.** Triggers and stored procs feel clever but become impossible to test, version, and reason about. Calculate prices in your application layer.

**Don't conflate quotes and invoices.** A quote is what the customer was told. An invoice is what they actually owe. Late changes — adding parts, extending time — should create new invoice lines, not modify the original quote.

**Don't forget about taxes.** They vary by jurisdiction, sometimes within a city. Use a service like TaxJar or Avalara. The two days you'll spend integrating it will save you forty days arguing with auditors later.
    `,
  },
  {
    slug: 'gitops-per-tenant-deploys',
    title: 'Deploy to one tenant without touching the rest: a GitOps recipe',
    excerpt: 'Sometimes you need to ship a hotfix for a single customer without restaging your entire fleet. Here\'s how we use Helm and ArgoCD to make that boring.',
    author: 'Aisha Rahman',
    authorRole: 'VP of Engineering',
    date: '2025-02-08',
    readTime: '5 min read',
    category: 'Engineering',
    tags: ['kubernetes', 'helm', 'argocd', 'devops'],
    body: `
The classic multi-tenant question: a customer hits an edge-case bug, you ship a fix, but you don't want to roll it to all 10,000 tenants until the customer signs off. How?

## Option 1: feature flags (works for code paths)

Wrap the new code in a flag scoped to a \`tenant_id\`. Toggle on. Customer tests. Toggle off if it breaks. We use Unleash for this.

This works great for behavior changes. It doesn't work for infrastructure changes, dependency upgrades, or anything that affects how the container itself runs.

## Option 2: per-tenant Helm values (works for everything else)

Our deployment unit isn't "the application." It's "the application configured for one tenant." Each tenant gets:

- A Kubernetes namespace (\`tenant-acme\`)
- A Helm release scoped to that namespace
- A \`values-acme.yaml\` file in our GitOps repo

The base Helm chart is one file. The per-tenant values are 5-20 lines:

\`\`\`yaml
# infrastructure/helm/values/values-acme.yaml
tenant:
  id: "uuid-acme"
  slug: acme
  planTier: pro

image:
  tag: "1.0.3-acme-hotfix"   # Acme runs a different version than the fleet

services:
  bookingService:
    replicaCount: 5            # higher because Acme has heavier traffic
    resources:
      limits: { cpu: 2000m, memory: 2Gi }
\`\`\`

ArgoCD watches the repo. Change one file → ArgoCD diffs → applies only to that namespace.

## The workflow

1. Engineer writes the fix on a branch.
2. Builds an image tagged \`1.0.3-acme-hotfix\` and pushes to the registry.
3. Opens a PR that changes one line in \`values-acme.yaml\`.
4. PR gets reviewed (CODEOWNERS rule ensures the right people see it).
5. Merge → ArgoCD picks up the change within 60 seconds → only Acme's pods get the new image.

Total elapsed time from "we need to fix Acme" to "Acme is running the fix" is usually under 20 minutes.

## What about rolling out to everyone later?

Once Acme is happy, the engineer bumps \`values-default.yaml\` to \`1.0.3\` (or whatever the canonical version is) and removes the override. ArgoCD rolls the fleet. Acme inherits the fleet version again. Their namespace becomes "boring" again.

## The boring part is the point

The first time you do a per-tenant deploy it feels exotic. By the tenth time it's a non-event — the same as any other PR. That's exactly what we wanted.
    `,
  },
  {
    slug: 'what-makes-customers-pay',
    title: 'The 4 things service-business customers will pay extra for',
    excerpt: 'We A/B tested 47 different upsells across our customer base last year. Four worked. The other 43 didn\'t move the needle. Here\'s what we learned.',
    author: 'Marcus Johnson',
    authorRole: 'VP of Sales',
    date: '2025-01-12',
    readTime: '4 min read',
    category: 'Business',
    tags: ['sales', 'pricing', 'customer-research'],
    body: `
Through our platform, we see what 10,000+ home-services businesses charge, what they offer as upsells, and what their customers actually buy. Here's what works.

## 1. Guaranteed timing

"We'll be there between 2-4pm" doesn't sell. "Guaranteed arrival by 3pm or 25% off" does. Customers will pay 15-30% more for a narrow appointment window. The mechanism: ServiceHub lets you offer "premium scheduling slots" at a price multiplier you control.

## 2. Same-day service

The willingness-to-pay curve is non-linear. Customers will pay roughly:
- Standard (3-5 day window): $0 premium
- Next-day: 10-15% premium
- Same-day: 40-60% premium
- Within 2 hours: 120-200% premium

The kicker: most "same-day" slots are filled by people who could have waited. They just don't want to.

## 3. Membership / maintenance plans

Recurring services beat one-off services by every metric: customer LTV, retention, predictable revenue, dispatcher utilization. The businesses that offer them are typically 35-45% more profitable than those that don't.

Don't make it complicated. "Quarterly tune-up, $99/quarter, includes priority scheduling" outperforms 6-tier programs.

## 4. Transparent technician profiles

Counterintuitive. We tested showing customers the technician's name, photo, and rating before they book versus generic "your technician." Conversion went up 18%. Cancellation rates went down 22%. Customers tip more.

People want to know who's coming to their house. Be the company that tells them.

## What didn't work

- Loyalty point programs (customers don't care, ops complains about the accounting)
- Bundle discounts beyond "service + maintenance plan"
- Bundling consumables (oil filters, drain catches) into service prices
- "Free inspection with any repair" upsells (felt slimy to customers)
- Referral bonuses paid in store credit (cash worked, store credit didn't)

## The thread

The four things that work all share a property: they reduce customer anxiety. When is someone coming? Will they be on time? Who is it? Will the system keep working after they leave?

Sell certainty. Customers pay for it.
    `,
  },
];

export function getPost(slug) {
  return POSTS.find((p) => p.slug === slug);
}

export function getAllPosts() {
  return [...POSTS].sort((a, b) => new Date(b.date) - new Date(a.date));
}

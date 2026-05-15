/**
 * Seeds initial content for the platform / content modules. Idempotent —
 * skips rows that already exist by unique key.
 */
exports.seed = async (knex) => {
  // ----- Theme presets -----
  const presets = [
    { slug: 'ocean',    name: 'Ocean Breeze',  description: 'Clean blue palette suitable for plumbing, HVAC, and pool services.', config: { primary_color: '#0066cc', secondary_color: '#00b8d9', background_color: '#f5fafd', text_color: '#0a2540', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 1 },
    { slug: 'forest',   name: 'Forest Trust',  description: 'Earthy greens — landscaping, lawn care, tree services.',           config: { primary_color: '#2d8659', secondary_color: '#86a873', background_color: '#f6f9f4', text_color: '#1f3a2c', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 2 },
    { slug: 'sunset',   name: 'Sunset Warmth', description: 'Warm oranges — handyman, electrical, general repairs.',            config: { primary_color: '#ea580c', secondary_color: '#facc15', background_color: '#fff8f3', text_color: '#3a1d0a', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 3 },
    { slug: 'midnight', name: 'Midnight Pro',  description: 'Premium dark theme — high-end remodeling, smart-home installs.',   config: { primary_color: '#7c3aed', secondary_color: '#a78bfa', background_color: '#0f172a', text_color: '#e2e8f0', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 4 },
    { slug: 'rose',     name: 'Rose Gold',     description: 'Elegant pinks — cleaning, organizing, spa-style services.',         config: { primary_color: '#e11d48', secondary_color: '#fb7185', background_color: '#fff5f7', text_color: '#3a0a1a', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 5 },
    { slug: 'slate',    name: 'Slate Modern',  description: 'Neutral, minimal — works for any service category.',                config: { primary_color: '#475569', secondary_color: '#94a3b8', background_color: '#f8fafc', text_color: '#0f172a', font_family: 'Inter, system-ui, sans-serif' }, sort_order: 6 },
  ];
  for (const p of presets) {
    await knex('theme_presets')
      .insert({ ...p, config: JSON.stringify(p.config) })
      .onConflict('slug').ignore();
  }

  // ----- Email templates -----
  const templates = [
    {
      template_key: 'welcome',
      name: 'Welcome (signup)',
      subject: 'Welcome to {{business_name}} on ServiceHub',
      body_html: '<p>Hi {{first_name}},</p><p>Your business account is live at <a href="{{portal_url}}">{{portal_url}}</a>. Customers can book in 30 seconds.</p><p>— The ServiceHub team</p>',
      variables: ['first_name', 'business_name', 'portal_url'],
    },
    {
      template_key: 'booking_confirm',
      name: 'Booking confirmation (customer)',
      subject: 'Your booking with {{business_name}} is confirmed',
      body_html: '<p>Hi {{customer_name}},</p><p>Your <strong>{{service_title}}</strong> is scheduled for <strong>{{scheduled_at}}</strong>. Quoted: ${{quoted_price}}.</p>',
      variables: ['customer_name', 'business_name', 'service_title', 'scheduled_at', 'quoted_price'],
    },
    {
      template_key: 'booking_reminder',
      name: 'Booking reminder (24h prior)',
      subject: 'Reminder: {{service_title}} tomorrow at {{scheduled_time}}',
      body_html: '<p>Hi {{customer_name}},</p><p>Just a reminder — your appointment is tomorrow at {{scheduled_time}}. Reply STOP to opt out of SMS.</p>',
      variables: ['customer_name', 'service_title', 'scheduled_time'],
    },
    {
      template_key: 'password_reset',
      name: 'Password reset',
      subject: 'Reset your ServiceHub password',
      body_html: '<p>Click <a href="{{reset_url}}">here</a> to reset your password. Link expires in 30 minutes.</p>',
      variables: ['reset_url'],
    },
    {
      template_key: 'tenant_suspended',
      name: 'Tenant suspended notice',
      subject: 'Your ServiceHub account has been suspended',
      body_html: '<p>Hi {{first_name}},</p><p>Your account has been temporarily suspended. Reason: {{reason}}. Please contact billing@servicehub.app.</p>',
      variables: ['first_name', 'reason'],
    },
  ];
  for (const t of templates) {
    await knex('email_templates')
      .insert({ ...t, variables: JSON.stringify(t.variables) })
      .onConflict('template_key').ignore();
  }

  // ----- Blog posts (move from static file into DB) -----
  const blogPosts = [
    {
      slug: 'why-multi-tenant-rls',
      title: 'Why we bet the company on PostgreSQL Row-Level Security',
      excerpt: "When we rebuilt our multi-tenant architecture in 2023, we had to choose between three isolation models. Here's why we picked the one that scares most teams.",
      author: 'Diego Alvarez',
      author_role: 'CTO',
      category: 'Engineering',
      tags: ['architecture', 'postgres', 'security'],
      read_time: '8 min read',
      published_at: '2025-04-22',
      body: "When you serve thousands of businesses on the same infrastructure, the question isn't whether you'll have a data leak — it's whether your architecture makes it inevitable.\n\n## The three models\n\nEvery multi-tenant SaaS chooses one of three architectures: silo, bridge, or pool.\n\nWe chose pool with Row-Level Security.\n\n## What RLS gives you\n\nRow-Level Security is a Postgres feature that lets you attach a policy to a table. Every query gets an automatic WHERE clause appended at the database engine level.",
    },
    {
      slug: 'pricing-rules-for-home-services',
      title: "How to design a pricing engine that doesn't break when your business does",
      excerpt: "Most service businesses outgrow their pricing tool within 18 months. Here's a framework for designing one that scales from solo operator to multi-state franchise.",
      author: 'Sarah Chen',
      author_role: 'COO',
      category: 'Operations',
      tags: ['pricing', 'business'],
      read_time: '6 min read',
      published_at: '2025-03-15',
      body: 'The first version of any pricing system is "$X per service." It works until it doesn\'t.\n\nWithin a year, most service businesses are juggling flat fees, hourly rates, distance surcharges, member discounts, seasonal pricing, square-footage scaling, and after-hours premiums.',
    },
    {
      slug: 'gitops-per-tenant-deploys',
      title: 'Deploy to one tenant without touching the rest: a GitOps recipe',
      excerpt: "Sometimes you need to ship a hotfix for a single customer without restaging your entire fleet. Here's how we use Helm and ArgoCD to make that boring.",
      author: 'Aisha Rahman',
      author_role: 'VP of Engineering',
      category: 'Engineering',
      tags: ['kubernetes', 'helm', 'argocd', 'devops'],
      read_time: '5 min read',
      published_at: '2025-02-08',
      body: 'The classic multi-tenant question: a customer hits an edge-case bug, you ship a fix, but you don\'t want to roll it to all 10,000 tenants until the customer signs off.',
    },
    {
      slug: 'what-makes-customers-pay',
      title: 'The 4 things service-business customers will pay extra for',
      excerpt: "We A/B tested 47 different upsells across our customer base last year. Four worked. Here's what we learned.",
      author: 'Marcus Johnson',
      author_role: 'VP of Sales',
      category: 'Business',
      tags: ['sales', 'pricing', 'customer-research'],
      read_time: '4 min read',
      published_at: '2025-01-12',
      body: "Through our platform, we see what 10,000+ home-services businesses charge, what they offer as upsells, and what their customers actually buy. Four things work consistently: guaranteed timing, same-day service, membership/maintenance plans, and transparent technician profiles.",
    },
  ];
  for (const p of blogPosts) {
    await knex('blog_posts')
      .insert({ ...p, tags: JSON.stringify(p.tags), is_published: true })
      .onConflict('slug').ignore();
  }

  // ----- Changelog entries -----
  const changelog = [
    { version: '2.4.0', title: 'Per-tenant feature flags via Unleash', tag: 'Feature',     released_at: '2026-05-12', notes: ['Toggle features on / off scoped to specific tenant IDs','Beta-rollout to 5% / 10% / 25% of tenants by plan tier','New /api/v1/feature-flags endpoints'] },
    { version: '2.3.7', title: 'Faster booking-search index',          tag: 'Improvement', released_at: '2026-05-03', notes: ['Added composite GIN index on (tenant_id, customer_id, scheduled_at)','Average booking-list query latency dropped from 38 ms → 9 ms'] },
    { version: '2.3.6', title: 'Logo upload edge cases',                tag: 'Fix',         released_at: '2026-04-22', notes: ['Fixed silent failure when uploading SVG files larger than 1 MB','Better error messages for unsupported mime types'] },
    { version: '2.3.0', title: 'Commission structures',                 tag: 'Feature',     released_at: '2026-04-10', notes: ['New commission_structures table — percent or flat fee, scoped to platform / staff / category / service','Bulk create endpoint for migrating existing rules','UI in onboarding wizard step 5'] },
    { version: '2.2.0', title: 'Onboarding wizard',                     tag: 'Feature',     released_at: '2026-03-28', notes: ['5-step setup: theme & logo → business details → categories → services → commissions','Resumable mid-wizard','6 curated theme presets with live preview'] },
    { version: '2.1.0', title: 'PostgreSQL Row-Level Security on every tenant-scoped table', tag: 'Security', released_at: '2026-03-05', notes: ['FORCE ROW LEVEL SECURITY enforced','New synthetic-tenant CI test asserts cross-tenant queries return zero rows','Split saas_user and migration roles'] },
    { version: '2.0.0', title: 'Multi-tenant rebuild',                  tag: 'Breaking',    released_at: '2026-02-14', notes: ['Migrated from single shared schema to RLS-protected pool model','Hash-partitioned bookings & audit_logs into 8 partitions','New x-tenant-slug header for cross-origin browser apps'] },
  ];
  for (const e of changelog) {
    const exists = await knex('changelog_entries').where({ version: e.version }).first();
    if (!exists) {
      await knex('changelog_entries').insert({ ...e, notes: JSON.stringify(e.notes) });
    }
  }

  // ----- Category templates + service templates (industry-grouped) -----
  const industries = {
    plumbing: {
      categories: [
        { name: 'Residential', children: ['Drain Cleaning', 'Water Heater', 'Leak Repair', 'Toilet Repair'] },
        { name: 'Commercial',  children: ['Pipe Inspection', 'Backflow Testing'] },
      ],
      services: {
        'Drain Cleaning':   [{ title: 'Standard Drain Unclog', price: 149, duration: 60 }, { title: 'Hydro Jetting', price: 379, duration: 120 }],
        'Water Heater':     [{ title: 'Water Heater Replacement', price: 1200, duration: 180 }, { title: 'Tankless Install', price: 2400, duration: 240 }],
      },
    },
    hvac: {
      categories: [
        { name: 'Air Conditioning', children: ['AC Repair', 'AC Install', 'Maintenance'] },
        { name: 'Heating',          children: ['Furnace Install', 'Furnace Repair'] },
      ],
      services: {
        'AC Repair':     [{ title: 'AC Diagnostic Visit', price: 95, duration: 60 }],
        'AC Install':    [{ title: 'Central AC Install', price: 4500, duration: 480 }],
      },
    },
    cleaning: {
      categories: [
        { name: 'Residential', children: ['Standard Clean', 'Deep Clean', 'Move-out'] },
      ],
      services: {
        'Standard Clean': [{ title: '3BR Standard Clean', price: 120, duration: 120 }],
        'Deep Clean':     [{ title: 'Whole-house Deep Clean', price: 280, duration: 240 }],
      },
    },
  };

  for (const [industry, plan] of Object.entries(industries)) {
    for (let i = 0; i < plan.categories.length; i += 1) {
      const cat = plan.categories[i];
      const exists = await knex('category_templates').where({ industry, name: cat.name, parent_id: null }).first();
      const parentId = exists?.id || (await knex('category_templates').insert({
        industry, name: cat.name, sort_order: i + 1,
      }).returning('id'))[0].id;

      for (let j = 0; j < cat.children.length; j += 1) {
        const childName = cat.children[j];
        const childExists = await knex('category_templates').where({ industry, name: childName, parent_id: parentId }).first();
        const childId = childExists?.id || (await knex('category_templates').insert({
          industry, name: childName, parent_id: parentId, sort_order: j + 1,
        }).returning('id'))[0].id;

        const svcList = plan.services[childName] || [];
        for (const svc of svcList) {
          const svcExists = await knex('service_templates').where({ category_template_id: childId, title: svc.title }).first();
          if (!svcExists) {
            await knex('service_templates').insert({
              category_template_id: childId,
              title: svc.title,
              default_price: svc.price,
              default_duration_mins: svc.duration,
              default_pricing_rule: JSON.stringify({ rule_type: 'flat', rate: svc.price }),
            });
          }
        }
      }
    }
  }

  // ----- Sample announcement -----
  const existing = await knex('announcements').where({ title: 'Welcome to ServiceHub v2.4' }).first();
  if (!existing) {
    await knex('announcements').insert({
      title: 'Welcome to ServiceHub v2.4',
      body: 'Per-tenant feature flags are now live. Toggle features per business from the Admin → Feature flags page.',
      level: 'info',
      audience: 'all',
      is_active: true,
    });
  }

  console.log('✓ Platform & content seed complete');
};

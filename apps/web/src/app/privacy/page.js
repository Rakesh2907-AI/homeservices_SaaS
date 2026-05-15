import MarketingLayout from '@/components/marketing/MarketingLayout';

export const metadata = { title: 'Privacy Policy — ServiceHub' };

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm text-gray-500 mb-2">Last updated: May 1, 2026</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>This Privacy Policy explains how ServiceHub Inc. ("ServiceHub", "we", "us") collects, uses, and shares information about you when you use our services.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Information we collect</h2>
          <p>We collect three categories of data:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Account data</strong> — name, email, business name, billing details. Required to operate your account.</li>
            <li><strong>Business operational data</strong> — your customers, bookings, services, and pricing. You own this data; we host it on your behalf.</li>
            <li><strong>Usage data</strong> — pages visited, features used, performance metrics. Used to improve the product.</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. How we use your data</h2>
          <p>We use your data to provide the service, send you account-related communications, comply with legal obligations, and improve the product. <strong>We do not sell your data. Ever.</strong> We do not train AI models on your business operational data without explicit, opt-in consent.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Data isolation</h2>
          <p>Your business operational data is isolated at the database level using PostgreSQL Row-Level Security. Other ServiceHub tenants cannot access your data regardless of who they are or what queries they run. Enterprise customers can elect dedicated database instances for physical isolation.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Subprocessors</h2>
          <p>We use third-party subprocessors to deliver the service. Current subprocessors include AWS (infrastructure), Stripe (payments), Twilio (SMS), and Postmark (transactional email). A complete and current list is available at /subprocessors.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Data retention and deletion</h2>
          <p>We retain account and operational data for as long as your account is active. On cancellation, we keep your data for 30 days in case you change your mind, then permanently delete it. You can export your data via API or CSV at any time. You can also request immediate deletion of specific records by contacting privacy@servicehub.app.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Security</h2>
          <p>We are SOC 2 Type II certified. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We perform annual third-party penetration tests and quarterly internal security reviews.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Your rights</h2>
          <p>If you are a resident of the EU, UK, California, or another jurisdiction with applicable privacy laws, you have the right to access, correct, delete, or export your personal data. To exercise these rights, contact privacy@servicehub.app.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">8. Cookies</h2>
          <p>We use a minimal set of cookies: one for session authentication, one for CSRF protection, and one for analytics (Plausible — no tracking, no fingerprinting, no third-party data sharing). We do not use third-party advertising cookies.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Contact</h2>
          <p>Questions? Reach our Data Protection Officer at privacy@servicehub.app or by mail at ServiceHub Inc., 1234 SW Morrison St, Floor 4, Portland, OR 97205, USA.</p>
        </div>
      </article>
    </MarketingLayout>
  );
}

import MarketingLayout from '@/components/marketing/MarketingLayout';

export const metadata = { title: 'Terms of Service — ServiceHub' };

export default function TermsPage() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm text-gray-500 mb-2">Last updated: May 1, 2026</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <p>These Terms govern your use of ServiceHub. By signing up, you agree to be bound by these Terms.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Your account</h2>
          <p>You&apos;re responsible for the activity that happens under your account. Keep your password secure. Notify us at security@servicehub.app if you suspect unauthorized access. You must be at least 18 and have legal authority to enter contracts on behalf of your business.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Acceptable use</h2>
          <p>Don&apos;t use ServiceHub to do anything illegal, harmful, or that violates someone else&apos;s rights. Specifically: no spam, no fraud, no scraping our service, no reverse-engineering, no using the service to compete with us.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Subscription and billing</h2>
          <p>Plans renew automatically until cancelled. You can cancel at any time from your dashboard — your service continues until the end of your current billing period. We do not offer refunds for partial periods, but we&apos;ll discuss exceptions in good faith for genuine hardship.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Your data</h2>
          <p>You own your data. We don&apos;t. We host it for you. You can export it any time. We will never sell it, share it with advertisers, or use it to train AI models without your explicit opt-in consent.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Service availability</h2>
          <p>We commit to the uptime SLA in your plan. If we miss it, you receive service credits per our SLA terms. We&apos;ll always tell you proactively about outages — see status.servicehub.app.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Termination</h2>
          <p>You can cancel anytime, no questions. We reserve the right to suspend accounts that violate these Terms, but we&apos;ll give you written notice and a chance to fix the issue first, except in cases of immediate harm.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, our total liability is capped at the amount you&apos;ve paid us in the 12 months preceding the claim. We&apos;re not liable for indirect or consequential damages.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">8. Changes to these terms</h2>
          <p>We may update these Terms. Material changes: 30 days notice via email. Minor clarifications: posted here with an updated date. Continuing to use the service after changes means you accept the new Terms.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Governing law</h2>
          <p>These Terms are governed by the laws of the State of Oregon, USA. Disputes are resolved in the state and federal courts of Multnomah County, Oregon.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">10. Contact</h2>
          <p>Questions about these Terms? legal@servicehub.app.</p>
        </div>
      </article>
    </MarketingLayout>
  );
}

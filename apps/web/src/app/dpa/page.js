import MarketingLayout from '@/components/marketing/MarketingLayout';

export const metadata = { title: 'Data Processing Agreement — ServiceHub' };

export default function DPAPage() {
  return (
    <MarketingLayout>
      <article className="max-w-3xl mx-auto px-6 py-20">
        <p className="text-sm text-gray-500 mb-2">Last updated: May 1, 2026 · Version 1.4</p>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Processing Agreement (DPA)</h1>
        <p className="text-lg text-gray-600 mb-8">For customers subject to GDPR, UK GDPR, or CCPA.</p>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 mb-8 text-sm text-blue-900">
          <strong>Need a signed copy?</strong> Download <a href="#" className="underline">our pre-signed DPA template</a> or
          request a counter-signed version at <a href="mailto:privacy@servicehub.app" className="underline">privacy@servicehub.app</a>.
        </div>

        <div className="space-y-6 text-gray-700 leading-relaxed">
          <h2 className="text-2xl font-bold text-gray-900 mt-8">1. Definitions</h2>
          <p>"Personal Data", "Data Subject", "Data Controller", "Data Processor", "Processing", and other capitalized terms have the meanings given in Regulation (EU) 2016/679 ("GDPR").</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">2. Subject matter and roles</h2>
          <p>Customer is the Data Controller. ServiceHub Inc. is the Data Processor. ServiceHub processes Personal Data only on Customer&apos;s documented instructions, including those embodied in the Service Agreement and the operation of the Service itself.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">3. Duration</h2>
          <p>This DPA is effective from the date Customer accepts the Service Agreement and remains in effect for as long as ServiceHub processes Personal Data on Customer&apos;s behalf.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">4. Nature and purpose of processing</h2>
          <p>ServiceHub processes Personal Data for the purpose of providing the booking, scheduling, payments, analytics, and communications features of the Service. Specifically, Personal Data is used to: (a) authenticate users; (b) deliver booking confirmations and reminders; (c) compute pricing and commissions; (d) generate analytics reports; (e) provide customer support.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">5. Types of Personal Data</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Identification: name, email, phone, business name</li>
            <li>Contact details: addresses (service and billing)</li>
            <li>Financial: invoices, payment method tokens (PANs never stored — handled by Stripe)</li>
            <li>Operational: bookings, service notes, photos uploaded by technicians</li>
            <li>Authentication: hashed passwords, IP addresses, session metadata</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">6. Categories of Data Subjects</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Customer&apos;s end customers (people booking services)</li>
            <li>Customer&apos;s employees, contractors, and staff</li>
            <li>Customer&apos;s administrators</li>
          </ul>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">7. Sub-processors</h2>
          <p>Customer authorizes ServiceHub to engage the sub-processors listed at <strong>servicehub.app/subprocessors</strong>. ServiceHub will give Customer at least 30 days&apos; notice before engaging a new sub-processor. Customer may object during this period; if no resolution is found, Customer may terminate the affected portion of the Service for cause.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">8. International transfers</h2>
          <p>For transfers of Personal Data from the EEA, UK, or Switzerland to countries without an adequacy decision, ServiceHub relies on the EU Standard Contractual Clauses (SCCs) 2021/914 and the UK Addendum. Customers may request executed copies.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">9. Security measures</h2>
          <p>ServiceHub implements appropriate technical and organizational measures, including: row-level data isolation at the database layer; encryption at rest (AES-256) and in transit (TLS 1.3); SOC 2 Type II certification; access controls based on least-privilege; quarterly security reviews; annual third-party penetration tests; documented incident-response procedures.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">10. Data subject requests</h2>
          <p>ServiceHub will assist Customer in fulfilling its obligations to respond to Data Subject Requests (access, deletion, portability, rectification) — typically by providing self-service tools in the Service. For requests requiring engineering work, ServiceHub will respond within 30 days.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">11. Data breach notification</h2>
          <p>ServiceHub will notify Customer without undue delay (and in any event within 72 hours) of becoming aware of a Personal Data Breach affecting Customer&apos;s data. The notification will include the nature, scope, and likely consequences, plus the measures taken to address it.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">12. Return or deletion</h2>
          <p>On termination, ServiceHub will, at Customer&apos;s choice, return or delete all Personal Data within 30 days. Customer can export data at any time via API or the dashboard. After 30 days from termination, data is permanently deleted from production systems and from backups within 90 days.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">13. Audits</h2>
          <p>Customer may audit ServiceHub&apos;s compliance with this DPA once per year. ServiceHub will satisfy this obligation by providing its SOC 2 Type II report and responses to security questionnaires (SIG, CAIQ). On-site audits are available for Enterprise customers under reasonable scoping.</p>

          <h2 className="text-2xl font-bold text-gray-900 mt-8">14. Contact</h2>
          <p>Data Protection Officer: privacy@servicehub.app · ServiceHub Inc., 1234 SW Morrison St, Floor 4, Portland, OR 97205, USA.</p>
        </div>
      </article>
    </MarketingLayout>
  );
}

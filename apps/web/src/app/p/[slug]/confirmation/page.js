'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import { portal, applyTenantTheme } from '@/lib/portal-api';

export default function ConfirmationPage() {
  const { slug } = useParams();
  const search = useSearchParams();
  const bookingId = search.get('b');
  const price = search.get('price');
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (!slug) return;
    portal.getTenant(slug).then((t) => { setTenant(t); applyTenantTheme(t.theme_config); });
  }, [slug]);

  return (
    <PortalShell tenant={tenant} slug={slug}>
      <section className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="inline-flex h-20 w-20 rounded-full items-center justify-center mb-6 shadow-lg" style={{ background: 'var(--brand-primary)' }}>
          <svg className="h-10 w-10 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold mb-3">You&apos;re booked!</h1>
        <p className="text-gray-600 text-lg mb-8">
          We&apos;ve received your appointment request. {tenant?.business_name || 'Our team'} will reach out shortly to confirm.
        </p>

        <div className="rounded-xl border border-gray-200 bg-white p-6 text-left mb-8">
          <h2 className="font-semibold mb-3">Booking details</h2>
          <Row label="Reference"><code className="font-mono text-xs">{bookingId?.slice(0, 8)}…</code></Row>
          {price && <Row label="Estimated total"><span className="font-bold" style={{ color: 'var(--brand-primary)' }}>${parseFloat(price).toFixed(2)}</span></Row>}
          <Row label="Status"><span className="text-xs rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-medium">Pending confirmation</span></Row>
        </div>

        <div className="text-sm text-gray-600 mb-8">
          <p>A confirmation email is on its way. Need to make changes?</p>
          {tenant?.business_details?.phone && <p className="mt-1">Call us at <a href={`tel:${tenant.business_details.phone}`} className="font-medium" style={{ color: 'var(--brand-primary)' }}>{tenant.business_details.phone}</a></p>}
        </div>

        <Link href={`/p/${slug}`} className="inline-flex rounded-md px-6 py-3 font-medium text-white" style={{ background: 'var(--brand-primary)' }}>Back to home</Link>
      </section>
    </PortalShell>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span>{children}</span>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import PortalShell from '@/components/portal/PortalShell';
import { portal, applyTenantTheme } from '@/lib/portal-api';

export default function BookServicePage() {
  const { slug, serviceId } = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState(null);
  const [service, setService] = useState(null);
  const [quote, setQuote] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    scheduled_at: defaultDateTime(),
    notes: '',
    customer: { full_name: '', email: '', phone: '', address: { line1: '', city: '', state: '', postal_code: '' } },
    after_hours: false,
  });

  useEffect(() => {
    if (!slug) return;
    portal.getTenant(slug).then((t) => { setTenant(t); applyTenantTheme(t.theme_config); });
    portal.getServices(slug).then((r) => {
      const s = r.data.find((x) => x.id === serviceId);
      setService(s || null);
    });
  }, [slug, serviceId]);

  // Auto-fetch quote when service loads or after_hours toggles
  useEffect(() => {
    if (!slug || !serviceId) return;
    portal.getQuote(slug, { service_id: serviceId, context: { after_hours: form.after_hours } })
      .then(setQuote).catch(() => setQuote(null));
  }, [slug, serviceId, form.after_hours]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }
  function updateCustomer(field, value) {
    setForm((f) => ({ ...f, customer: { ...f.customer, [field]: value } }));
  }
  function updateAddress(field, value) {
    setForm((f) => ({ ...f, customer: { ...f.customer, address: { ...f.customer.address, [field]: value } } }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const payload = {
        service_id: serviceId,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        customer: form.customer,
        notes: form.notes || undefined,
        quoted_price: quote?.quote?.total,
      };
      const booking = await portal.createBooking(slug, payload);
      router.push(`/p/${slug}/confirmation?b=${booking.id}&price=${quote?.quote?.total ?? ''}`);
    } catch (err) {
      setError(err.message); setBusy(false);
    }
  }

  if (!service) {
    return (
      <PortalShell tenant={tenant} slug={slug}>
        <div className="max-w-3xl mx-auto px-6 py-16">
          <Link href={`/p/${slug}/services`} className="text-sm hover:opacity-70" style={{ color: 'var(--brand-primary)' }}>← Back to services</Link>
          <p className="mt-6 text-gray-500">Loading service…</p>
        </div>
      </PortalShell>
    );
  }

  return (
    <PortalShell tenant={tenant} slug={slug}>
      <section className="max-w-5xl mx-auto px-6 py-10">
        <Link href={`/p/${slug}/services`} className="text-sm hover:opacity-70" style={{ color: 'var(--brand-primary)' }}>← Back to services</Link>
        <h1 className="mt-4 text-3xl font-bold">{service.title}</h1>
        {service.description && <p className="mt-2 text-gray-600">{service.description}</p>}

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-[1fr,360px] gap-8">
          {/* Form */}
          <form onSubmit={submit} className="rounded-xl bg-white border border-gray-200 p-6 space-y-5">
            <div>
              <h2 className="font-semibold mb-3">When do you need it?</h2>
              <input
                type="datetime-local" required
                value={form.scheduled_at}
                onChange={(e) => update('scheduled_at', e.target.value)}
                min={defaultDateTime()}
                className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': 'var(--brand-primary)' }}
              />
              <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                <input type="checkbox" checked={form.after_hours} onChange={(e) => update('after_hours', e.target.checked)} />
                After-hours appointment (×1.5 surcharge)
              </label>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Your details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm" placeholder="Full name" required value={form.customer.full_name} onChange={(e) => updateCustomer('full_name', e.target.value)} />
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm" type="email" placeholder="Email" value={form.customer.email} onChange={(e) => updateCustomer('email', e.target.value)} />
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm md:col-span-2" type="tel" placeholder="Phone" value={form.customer.phone} onChange={(e) => updateCustomer('phone', e.target.value)} />
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Service address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm md:col-span-2" placeholder="Street address" value={form.customer.address.line1} onChange={(e) => updateAddress('line1', e.target.value)} />
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm" placeholder="City" value={form.customer.address.city} onChange={(e) => updateAddress('city', e.target.value)} />
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm" placeholder="State" value={form.customer.address.state} onChange={(e) => updateAddress('state', e.target.value)} />
                <input className="rounded-md border border-gray-300 px-3 py-2.5 text-sm md:col-span-2" placeholder="ZIP" value={form.customer.address.postal_code} onChange={(e) => updateAddress('postal_code', e.target.value)} />
              </div>
            </div>

            <div>
              <h2 className="font-semibold mb-3">Notes (optional)</h2>
              <textarea rows={3} className="w-full rounded-md border border-gray-300 px-3 py-2.5 text-sm" placeholder="Anything we should know? (gate code, pet, etc.)" value={form.notes} onChange={(e) => update('notes', e.target.value)} />
            </div>

            {error && <div className="rounded-md bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-700">{error}</div>}

            <button type="submit" disabled={busy} className="w-full rounded-md py-3 font-medium text-white text-base shadow-md disabled:opacity-50" style={{ background: 'var(--brand-primary)' }}>
              {busy ? 'Confirming…' : `Book for $${quote?.quote?.total?.toFixed(2) ?? '—'}`}
            </button>
            <p className="text-xs text-gray-500 text-center">You won&apos;t be charged until after service is complete.</p>
          </form>

          {/* Quote summary */}
          <aside className="lg:sticky lg:top-24 self-start">
            <div className="rounded-xl bg-white border border-gray-200 p-6">
              <h2 className="font-semibold mb-4">Estimate</h2>
              {!quote ? (
                <p className="text-sm text-gray-500">Calculating…</p>
              ) : (
                <>
                  <ul className="space-y-2 mb-4">
                    {quote.quote.line_items.map((it, i) => (
                      <li key={i} className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate pr-2">{it.label}</span>
                        <span className={`font-mono ${it.amount < 0 ? 'text-emerald-600' : ''}`}>{it.amount < 0 ? '-' : ''}${Math.abs(it.amount).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="border-t border-gray-100 pt-3 space-y-1.5 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-mono">${quote.quote.subtotal.toFixed(2)}</span>
                    </div>
                    {quote.quote.taxes > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Taxes</span>
                        <span className="font-mono">${quote.quote.taxes.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                      <span>Total</span>
                      <span style={{ color: 'var(--brand-primary)' }}>${quote.quote.total.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="mt-4 text-[10px] text-gray-400">Quote generated {new Date(quote.quote.computed_at).toLocaleTimeString()}. Final price may vary based on actual service performed.</p>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>
    </PortalShell>
  );
}

function defaultDateTime() {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  // datetime-local input wants YYYY-MM-DDTHH:mm
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

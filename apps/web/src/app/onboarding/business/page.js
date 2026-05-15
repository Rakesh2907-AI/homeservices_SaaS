'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/components/WizardShell';
import { api } from '@/lib/api';

export default function BusinessStep() {
  const router = useRouter();
  const [form, setForm] = useState({
    business_name: '',
    phone: '',
    email: '',
    website: '',
    tax_id: '',
    description: '',
    address: { line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US' },
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.onboardingStatus().then((t) => {
      const d = t?.business_details || {};
      setForm((f) => ({
        ...f,
        business_name: t?.business_name || '',
        phone: d.phone || '',
        email: d.email || '',
        website: d.website || '',
        tax_id: d.tax_id || '',
        description: d.description || '',
        address: { ...f.address, ...(d.address || {}) },
      }));
    });
  }, []);

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })); }
  function setAddr(field) { return (e) => setForm((f) => ({ ...f, address: { ...f.address, [field]: e.target.value } })); }

  async function next(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      await api.updateBusiness(form);
      await api.completeStep('business');
      router.push('/onboarding/categories');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <WizardShell stepId="business">
      <h2 className="text-2xl font-bold mb-2">Business details</h2>
      <p className="text-gray-600 mb-6">These appear on quotes, invoices, and your customer portal.</p>

      <form onSubmit={next} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Business name</label>
            <input className="input" required value={form.business_name} onChange={set('business_name')} />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={form.phone} onChange={set('phone')} placeholder="+1 555 0100" />
          </div>
          <div>
            <label className="label">Contact email</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="hello@yourbiz.com" />
          </div>
          <div>
            <label className="label">Website</label>
            <input className="input" type="url" value={form.website} onChange={set('website')} placeholder="https://yourbiz.com" />
          </div>
          <div>
            <label className="label">Tax ID / EIN</label>
            <input className="input" value={form.tax_id} onChange={set('tax_id')} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={set('description')} placeholder="A short blurb your customers will see…" />
        </div>

        <fieldset className="border rounded-md p-4 space-y-3">
          <legend className="px-2 text-sm font-medium">Address</legend>
          <input className="input" placeholder="Street address" value={form.address.line1} onChange={setAddr('line1')} />
          <input className="input" placeholder="Suite / unit (optional)" value={form.address.line2} onChange={setAddr('line2')} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="City" value={form.address.city} onChange={setAddr('city')} />
            <input className="input" placeholder="State" value={form.address.state} onChange={setAddr('state')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="ZIP / Postal code" value={form.address.postal_code} onChange={setAddr('postal_code')} />
            <input className="input" placeholder="Country" value={form.address.country} onChange={setAddr('country')} />
          </div>
        </fieldset>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <div className="flex justify-between pt-2">
          <button type="button" onClick={() => router.push('/onboarding/theme')} className="btn-secondary">← Back</button>
          <button type="submit" disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Continue →'}</button>
        </div>
      </form>
    </WizardShell>
  );
}

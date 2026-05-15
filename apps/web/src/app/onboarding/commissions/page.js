'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/components/WizardShell';
import { api } from '@/lib/api';

export default function CommissionsStep() {
  const router = useRouter();
  const [items, setItems] = useState([
    { name: 'Platform fee', applies_to: 'platform', rate_type: 'percent', rate_value: '5' },
    { name: 'Field technician commission', applies_to: 'staff', rate_type: 'percent', rate_value: '15' },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  function update(i, field, value) {
    setItems((x) => x.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  }
  function add() { setItems((x) => [...x, { name: '', applies_to: 'staff', rate_type: 'percent', rate_value: '10' }]); }
  function remove(i) { setItems((x) => x.filter((_, idx) => idx !== i)); }

  async function next() {
    setBusy(true); setError(null);
    try {
      const clean = items
        .filter((r) => r.name.trim() && r.rate_value !== '')
        .map((r) => ({
          name: r.name.trim(),
          applies_to: r.applies_to,
          rate_type: r.rate_type,
          rate_value: parseFloat(r.rate_value),
        }));
      if (clean.length) await api.createCommissionsBulk(clean);
      await api.completeStep('commissions');
      router.push('/onboarding/complete');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <WizardShell stepId="commissions">
      <h2 className="text-2xl font-bold mb-2">Commission & fees</h2>
      <p className="text-gray-600 mb-6">
        Define how revenue is split. "Platform fee" is what the SaaS keeps. "Staff commission" is what techs earn per job.
        You can scope rules to specific categories or services later.
      </p>

      <div className="space-y-3 mb-6">
        {items.map((r, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 items-center">
            <input className="input col-span-4" placeholder="Rule name" value={r.name} onChange={(e) => update(i, 'name', e.target.value)} />
            <select className="input col-span-3" value={r.applies_to} onChange={(e) => update(i, 'applies_to', e.target.value)}>
              <option value="platform">Platform fee</option>
              <option value="staff">Staff commission</option>
              <option value="category">Per category</option>
              <option value="service">Per service</option>
            </select>
            <select className="input col-span-2" value={r.rate_type} onChange={(e) => update(i, 'rate_type', e.target.value)}>
              <option value="percent">% of total</option>
              <option value="flat">$ flat</option>
            </select>
            <div className="col-span-2 flex items-center gap-1">
              <input className="input" type="number" min="0" step="0.01" value={r.rate_value} onChange={(e) => update(i, 'rate_value', e.target.value)} />
              <span className="text-gray-500 text-sm">{r.rate_type === 'percent' ? '%' : '$'}</span>
            </div>
            <button type="button" onClick={() => remove(i)} className="col-span-1 text-sm text-red-600">×</button>
          </div>
        ))}
        <button type="button" onClick={add} className="btn-secondary w-full">+ Add commission rule</button>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <p className="text-xs text-gray-500 mb-4">You can skip this step and configure later from the dashboard.</p>

      <div className="flex justify-between">
        <button onClick={() => router.push('/onboarding/services')} className="btn-secondary">← Back</button>
        <button onClick={next} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Finish setup →'}</button>
      </div>
    </WizardShell>
  );
}

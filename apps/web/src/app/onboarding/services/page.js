'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/components/WizardShell';
import { api } from '@/lib/api';

export default function ServicesStep() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listCategories().then((r) => {
      setCategories(r.data);
      if (r.data.length) {
        setItems([newRow(r.data[0].id)]);
      }
    });
  }, []);

  function newRow(category_id) {
    return {
      category_id,
      title: '',
      description: '',
      base_price: '',
      duration_mins: 60,
      pricing_rule: 'flat', // flat | hourly
      hourly_rate: '',
    };
  }

  function add() {
    setItems((x) => [...x, newRow(categories[0]?.id)]);
  }
  function update(i, field, value) {
    setItems((x) => x.map((row, idx) => idx === i ? { ...row, [field]: value } : row));
  }
  function remove(i) { setItems((x) => x.filter((_, idx) => idx !== i)); }

  async function next() {
    setBusy(true); setError(null);
    try {
      const clean = items
        .filter((it) => it.title.trim() && it.category_id)
        .map((it) => ({
          category_id: it.category_id,
          title: it.title.trim(),
          description: it.description.trim() || null,
          base_price: it.base_price ? parseFloat(it.base_price) : null,
          duration_mins: it.duration_mins ? parseInt(it.duration_mins, 10) : null,
          pricing_rules: [
            it.pricing_rule === 'flat' && it.base_price
              ? { rule_type: 'flat', rate: parseFloat(it.base_price) }
              : null,
            it.pricing_rule === 'hourly' && it.hourly_rate
              ? { rule_type: 'hourly', rate: parseFloat(it.hourly_rate) }
              : null,
          ].filter(Boolean),
        }));

      if (clean.length === 0) {
        const existing = await api.listServices();
        if (existing.data.length === 0) {
          setError('Add at least one service before continuing.');
          setBusy(false); return;
        }
      } else {
        await api.createServicesBulk(clean);
      }
      await api.completeStep('services');
      router.push('/onboarding/commissions');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <WizardShell stepId="services">
      <h2 className="text-2xl font-bold mb-2">Services & pricing</h2>
      <p className="text-gray-600 mb-6">Define what you offer. Each service belongs to a category and has a base price + optional pricing rule.</p>

      {categories.length === 0 && (
        <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
          You need at least one category first. <button className="underline" onClick={() => router.push('/onboarding/categories')}>Go back</button>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {items.map((it, i) => (
          <div key={i} className="border rounded-md p-4 space-y-3">
            <div className="flex gap-2">
              <select className="input flex-1" value={it.category_id || ''} onChange={(e) => update(i, 'category_id', e.target.value)}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_category_id ? '  ↳ ' : ''}{c.name}
                  </option>
                ))}
              </select>
              <button type="button" onClick={() => remove(i)} className="text-sm text-red-600">Remove</button>
            </div>

            <input className="input" placeholder="Service title (e.g. Standard Drain Unclog)" value={it.title} onChange={(e) => update(i, 'title', e.target.value)} />
            <textarea className="input" rows={2} placeholder="Description (optional)" value={it.description} onChange={(e) => update(i, 'description', e.target.value)} />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">Duration (min)</label>
                <input className="input" type="number" min="5" step="5" value={it.duration_mins} onChange={(e) => update(i, 'duration_mins', e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Pricing</label>
                <select className="input" value={it.pricing_rule} onChange={(e) => update(i, 'pricing_rule', e.target.value)}>
                  <option value="flat">Flat fee</option>
                  <option value="hourly">Hourly</option>
                </select>
              </div>
              <div>
                <label className="label text-xs">{it.pricing_rule === 'hourly' ? 'Hourly rate' : 'Flat price'} ($)</label>
                {it.pricing_rule === 'hourly' ? (
                  <input className="input" type="number" min="0" step="0.01" value={it.hourly_rate} onChange={(e) => update(i, 'hourly_rate', e.target.value)} />
                ) : (
                  <input className="input" type="number" min="0" step="0.01" value={it.base_price} onChange={(e) => update(i, 'base_price', e.target.value)} />
                )}
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={add} disabled={categories.length === 0} className="btn-secondary w-full">+ Add service</button>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <div className="flex justify-between">
        <button onClick={() => router.push('/onboarding/categories')} className="btn-secondary">← Back</button>
        <button onClick={next} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Continue →'}</button>
      </div>
    </WizardShell>
  );
}

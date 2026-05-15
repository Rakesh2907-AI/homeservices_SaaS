'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/components/WizardShell';
import { api } from '@/lib/api';

const TEMPLATES = {
  plumbing: { name: 'Plumbing', children: ['Drain Cleaning', 'Water Heater', 'Leak Repair', 'Toilet Repair'] },
  hvac: { name: 'HVAC', children: ['AC Repair', 'Heater Install', 'Duct Cleaning', 'Maintenance'] },
  electrical: { name: 'Electrical', children: ['Wiring', 'Outlets & Switches', 'Panel Upgrade', 'Lighting'] },
  cleaning: { name: 'Cleaning', children: ['House Cleaning', 'Deep Clean', 'Move-In/Out', 'Carpet'] },
  landscaping: { name: 'Landscaping', children: ['Lawn Mowing', 'Tree Trimming', 'Garden Care', 'Snow Removal'] },
};

export default function CategoriesStep() {
  const router = useRouter();
  const [items, setItems] = useState([]); // [{ name, children: [{name}] }]
  const [existing, setExisting] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listCategories().then((r) => {
      setExisting(r.data);
      if (r.data.length === 0) {
        // Empty — start with one editable parent
        setItems([{ name: '', children: [{ name: '' }] }]);
      }
    });
  }, []);

  function addParent() { setItems((x) => [...x, { name: '', children: [{ name: '' }] }]); }
  function removeParent(i) { setItems((x) => x.filter((_, idx) => idx !== i)); }
  function updateParent(i, name) { setItems((x) => x.map((p, idx) => idx === i ? { ...p, name } : p)); }
  function addChild(i) { setItems((x) => x.map((p, idx) => idx === i ? { ...p, children: [...p.children, { name: '' }] } : p)); }
  function updateChild(i, j, name) {
    setItems((x) => x.map((p, idx) => idx === i ? { ...p, children: p.children.map((c, jdx) => jdx === j ? { name } : c) } : p));
  }
  function removeChild(i, j) {
    setItems((x) => x.map((p, idx) => idx === i ? { ...p, children: p.children.filter((_, jdx) => jdx !== j) } : p));
  }
  function applyTemplate(key) {
    const t = TEMPLATES[key];
    setItems((x) => [...x, { name: t.name, children: t.children.map((n) => ({ name: n })) }]);
  }

  async function next() {
    setBusy(true); setError(null);
    try {
      // Strip empty entries
      const clean = items
        .filter((p) => p.name.trim())
        .map((p) => ({ name: p.name.trim(), children: p.children.filter((c) => c.name.trim()).map((c) => ({ name: c.name.trim() })) }));

      if (clean.length === 0 && existing.length === 0) {
        setError('Add at least one category before continuing.');
        setBusy(false); return;
      }
      if (clean.length) await api.createCategoriesBulk(clean);
      await api.completeStep('categories');
      router.push('/onboarding/services');
    } catch (e) { setError(e.message); setBusy(false); }
  }

  return (
    <WizardShell stepId="categories">
      <h2 className="text-2xl font-bold mb-2">Service categories</h2>
      <p className="text-gray-600 mb-6">Group your services — customers browse by category. Add sub-categories for nesting (e.g. Plumbing → Drain Cleaning).</p>

      {existing.length > 0 && (
        <div className="mb-6 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          You already have <strong>{existing.length}</strong> categor{existing.length === 1 ? 'y' : 'ies'}. New entries below will be added.
        </div>
      )}

      <div className="mb-4">
        <span className="text-sm text-gray-600 mr-2">Quick-start template:</span>
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <button key={k} type="button" onClick={() => applyTemplate(k)} className="text-xs mr-2 mb-2 px-2 py-1 rounded border border-gray-300 hover:bg-gray-50">
            + {t.name}
          </button>
        ))}
      </div>

      <div className="space-y-4 mb-6">
        {items.map((parent, i) => (
          <div key={i} className="border rounded-md p-4">
            <div className="flex items-center gap-2 mb-3">
              <input
                className="input flex-1 font-semibold"
                placeholder="Category name (e.g. Plumbing)"
                value={parent.name}
                onChange={(e) => updateParent(i, e.target.value)}
              />
              <button type="button" onClick={() => removeParent(i)} className="text-sm text-red-600">Remove</button>
            </div>
            <div className="pl-4 space-y-2">
              {parent.children.map((child, j) => (
                <div key={j} className="flex items-center gap-2">
                  <span className="text-gray-400">↳</span>
                  <input
                    className="input flex-1"
                    placeholder="Sub-category (e.g. Drain Cleaning)"
                    value={child.name}
                    onChange={(e) => updateChild(i, j, e.target.value)}
                  />
                  <button type="button" onClick={() => removeChild(i, j)} className="text-xs text-red-600">×</button>
                </div>
              ))}
              <button type="button" onClick={() => addChild(i)} className="text-sm text-gray-600 underline">+ Add sub-category</button>
            </div>
          </div>
        ))}
        <button type="button" onClick={addParent} className="btn-secondary w-full">+ Add category</button>
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <div className="flex justify-between">
        <button onClick={() => router.push('/onboarding/business')} className="btn-secondary">← Back</button>
        <button onClick={next} disabled={busy} className="btn-primary">{busy ? 'Saving…' : 'Continue →'}</button>
      </div>
    </WizardShell>
  );
}

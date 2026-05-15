'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell, { applyThemeVars } from '@/components/WizardShell';
import { api } from '@/lib/api';

export default function ThemeStep() {
  const router = useRouter();
  const [presets, setPresets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.themePresets().then((r) => setPresets(r.data)).catch((e) => setError(e.message));
    api.onboardingStatus().then((t) => {
      if (t?.logo_url) setLogoPreview(t.logo_url);
      if (t?.theme_config?.primary_color) {
        const match = (preset) => preset.config.primary_color === t.theme_config.primary_color;
        if (presets.length) {
          const found = presets.find(match);
          if (found) setSelected(found);
        }
      }
    });
  }, []);

  async function uploadLogo(file) {
    setUploading(true);
    try {
      const res = await api.uploadLogo(file);
      setLogoPreview(res.url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function next() {
    if (!selected) { setError('Pick a theme first'); return; }
    setBusy(true); setError(null);
    try {
      await api.updateTheme(selected.config);
      await api.completeStep('theme');
      router.push('/onboarding/business');
    } catch (e) {
      setError(e.message); setBusy(false);
    }
  }

  return (
    <WizardShell stepId="theme">
      <h2 className="text-2xl font-bold mb-2">Choose your look</h2>
      <p className="text-gray-600 mb-6">Pick a theme — you can fine-tune it any time from your dashboard.</p>

      {/* Logo upload */}
      <div className="mb-8">
        <label className="label">Logo (PNG / JPG / SVG, max 2 MB)</label>
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50 overflow-hidden">
            {logoPreview ? <img src={logoPreview} alt="logo" className="max-h-full max-w-full" /> : <span className="text-xs text-gray-400">No logo</span>}
          </div>
          <label className="btn-secondary cursor-pointer">
            {uploading ? 'Uploading…' : (logoPreview ? 'Replace logo' : 'Upload logo')}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files[0] && uploadLogo(e.target.files[0])} />
          </label>
        </div>
      </div>

      {/* Theme presets */}
      <label className="label">Theme</label>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => { setSelected(p); applyThemeVars(p.config); }}
            className={`text-left rounded-lg border-2 p-4 transition ${selected?.id === p.id ? 'shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            style={selected?.id === p.id ? { borderColor: p.config.primary_color } : undefined}
          >
            <div className="flex gap-1 mb-3">
              <div className="h-8 w-8 rounded" style={{ background: p.config.primary_color }} />
              <div className="h-8 w-8 rounded" style={{ background: p.config.secondary_color }} />
              <div className="h-8 w-8 rounded border" style={{ background: p.config.background_color }} />
            </div>
            <div className="font-semibold">{p.name}</div>
            <div className="text-xs text-gray-600 mt-1">{p.description}</div>
          </button>
        ))}
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      <div className="flex justify-end">
        <button onClick={next} disabled={busy || !selected} className="btn-primary">
          {busy ? 'Saving…' : 'Continue →'}
        </button>
      </div>
    </WizardShell>
  );
}

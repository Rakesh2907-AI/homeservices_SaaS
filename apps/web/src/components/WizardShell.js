'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api, getSession } from '@/lib/api';

const STEPS = [
  { id: 'theme', label: 'Theme & logo' },
  { id: 'business', label: 'Business details' },
  { id: 'categories', label: 'Categories' },
  { id: 'services', label: 'Services & pricing' },
  { id: 'commissions', label: 'Commissions' },
  { id: 'complete', label: 'Done!' },
];

export default function WizardShell({ stepId, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    if (!getSession().token) {
      router.push('/login');
      return;
    }
    api.onboardingStatus().then((t) => {
      setTenant(t);
      // Apply current theme as CSS vars
      if (t?.theme_config) applyThemeVars(t.theme_config);
    }).catch(() => router.push('/login'));
  }, [pathname, router]);

  const currentIdx = STEPS.findIndex((s) => s.id === stepId);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant?.logo_url
              ? <img src={tenant.logo_url} alt="logo" className="h-8" />
              : <div className="h-8 w-8 rounded" style={{ background: 'var(--brand-primary)' }} />}
            <span className="font-semibold">{tenant?.business_name || 'Setup'}</span>
          </div>
          <span className="text-sm text-gray-500">Step {currentIdx + 1} of {STEPS.length}</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <ol className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <li key={s.id} className="flex-1">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    done ? 'text-white' : active ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`} style={done || active ? { background: 'var(--brand-primary)' } : undefined}>
                    {done ? '✓' : i + 1}
                  </div>
                  <span className={`text-xs hidden md:inline ${active ? 'font-semibold' : 'text-gray-500'}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`h-0.5 mt-2 ${done ? '' : 'bg-gray-200'}`} style={done ? { background: 'var(--brand-primary)' } : undefined} />}
              </li>
            );
          })}
        </ol>

        <div className="card">{children}</div>
      </div>
    </div>
  );
}

export function applyThemeVars(cfg) {
  if (typeof document === 'undefined' || !cfg) return;
  const root = document.documentElement;
  if (cfg.primary_color) root.style.setProperty('--brand-primary', cfg.primary_color);
  if (cfg.secondary_color) root.style.setProperty('--brand-secondary', cfg.secondary_color);
  if (cfg.background_color) root.style.setProperty('--brand-bg', cfg.background_color);
  if (cfg.text_color) root.style.setProperty('--brand-text', cfg.text_color);
}

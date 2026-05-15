'use client';
import { useState } from 'react';
import { Card, CardHeader, Badge, Button } from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

/**
 * Settings tab. Shows the rest of the tenant configuration that doesn't fit
 * neatly into another tab — domain, branding, business details JSON, plan
 * override, danger-zone actions.
 */
export default function SettingsTab({ tenantId, summary, onRefresh }) {
  const t = summary?.tenant;
  const [plan, setPlan] = useState(t?.plan_tier || 'basic');
  const [savingPlan, setSavingPlan] = useState(false);
  const [error, setError] = useState(null);

  async function changePlan() {
    setSavingPlan(true); setError(null);
    try {
      await adminFetch(`/api/v1/admin/tenants/${tenantId}`, { method: 'PATCH', body: JSON.stringify({ plan_tier: plan }) });
      onRefresh?.();
    } catch (e) { setError(e.message); }
    finally { setSavingPlan(false); }
  }

  if (!t) return null;

  return (
    <div className="space-y-6">
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {/* Identity */}
      <Card>
        <CardHeader title="Identity" description="Core identifiers for this tenant." />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-3 text-sm">
          <Row label="Business name">{t.business_name}</Row>
          <Row label="Tenant ID"><code className="font-mono text-xs">{t.tenant_id}</code></Row>
          <Row label="Subdomain"><code className="font-mono text-xs">{t.subdomain}</code></Row>
          <Row label="Custom domain">{t.custom_domain ? <code className="font-mono text-xs">{t.custom_domain}</code> : <span className="text-dim">Not configured</span>}</Row>
          <Row label="Created">{new Date(t.created_at).toLocaleString()}</Row>
          <Row label="Last updated">{new Date(t.updated_at).toLocaleString()}</Row>
        </div>
      </Card>

      {/* Plan management */}
      <Card>
        <CardHeader
          title="Plan"
          description="Change the tenant's subscription tier. Updates the plan_tier column; subscription state is unaffected."
          action={
            <Button onClick={changePlan} disabled={savingPlan || plan === t.plan_tier} variant="primary" size="sm">
              {savingPlan ? 'Saving…' : 'Apply plan change'}
            </Button>
          }
        />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {['basic', 'pro', 'enterprise'].map((p) => (
            <label key={p} className={`relative rounded-lg border-2 p-4 cursor-pointer transition ${plan === p ? 'border-blue-500 bg-blue-50/40' : 'border-gray-200 hover:border-gray-300'}`}>
              <input type="radio" className="sr-only" checked={plan === p} onChange={() => setPlan(p)} />
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{p}</span>
                {plan === p && <Icon.Check className="h-4 w-4 text-blue-600" />}
              </div>
              <div className="mt-1 text-xs text-muted">
                {p === 'basic' && 'Up to 5 staff · email support'}
                {p === 'pro' && 'Up to 25 staff · custom domain · API'}
                {p === 'enterprise' && 'Unlimited · dedicated DB · SSO'}
              </div>
            </label>
          ))}
        </div>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader title="Branding" description="The visual identity tenants present in their portal." />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Logo</div>
            {t.logo_url ? (
              <img src={t.logo_url} alt="logo" className="h-20 max-w-[200px] border border-gray-200 rounded-md bg-white p-2 object-contain" />
            ) : (
              <div className="text-sm text-dim italic">No logo uploaded.</div>
            )}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-2">Theme</div>
            {t.theme_config && Object.keys(t.theme_config).length > 0 ? (
              <div className="space-y-2 text-sm">
                {Object.entries(t.theme_config).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <code className="font-mono text-xs text-muted">{k}</code>
                    {typeof v === 'string' && v.startsWith('#') ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-4 w-4 rounded border border-gray-200" style={{ background: v }} />
                        <code className="font-mono text-xs">{v}</code>
                      </div>
                    ) : (
                      <code className="font-mono text-xs">{String(v).slice(0, 30)}</code>
                    )}
                  </div>
                ))}
              </div>
            ) : <div className="text-sm text-dim italic">No theme configured.</div>}
          </div>
        </div>
      </Card>

      {/* Business details JSON */}
      <Card>
        <CardHeader title="Business details" description="The free-form configuration the tenant supplied during onboarding." />
        {t.business_details && Object.keys(t.business_details).length > 0 ? (
          <pre className="mt-4 text-[11px] bg-gray-50 border border-gray-100 rounded p-3 overflow-x-auto font-mono text-gray-700 max-h-80">
            {JSON.stringify(t.business_details, null, 2)}
          </pre>
        ) : (
          <p className="mt-3 text-sm text-dim italic">No business details on file.</p>
        )}
      </Card>

      {/* Danger zone */}
      <Card className="border-rose-200 bg-rose-50/30">
        <CardHeader title="Danger zone" description="Irreversible operations. Use sparingly." />
        <div className="mt-4 space-y-3">
          <div className="flex items-start justify-between gap-4 rounded-md border border-rose-200 bg-white p-4">
            <div>
              <div className="font-medium text-sm">Suspend tenant</div>
              <p className="text-xs text-muted mt-0.5">Temporarily disables sign-in for all of the tenant's users. They can be reactivated at any time.</p>
            </div>
            <Button variant={t.is_active ? 'destructive' : 'accent'} size="sm" onClick={async () => {
              if (!confirm(t.is_active ? 'Suspend this tenant?' : 'Reactivate this tenant?')) return;
              try {
                await adminFetch(`/api/v1/admin/tenants/${tenantId}`, { method: 'PATCH', body: JSON.stringify({ is_active: !t.is_active }) });
                onRefresh?.();
              } catch (e) { setError(e.message); }
            }}>
              {t.is_active ? 'Suspend' : 'Reactivate'}
            </Button>
          </div>
          <div className="flex items-start justify-between gap-4 rounded-md border border-rose-200 bg-white p-4">
            <div>
              <div className="font-medium text-sm">Delete tenant data</div>
              <p className="text-xs text-muted mt-0.5">Permanently removes all data for this tenant — bookings, customers, services, users. Not yet implemented in the admin UI; run via DB.</p>
            </div>
            <Button variant="destructive" size="sm" disabled>Not exposed</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.08em] font-semibold text-muted mb-0.5">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

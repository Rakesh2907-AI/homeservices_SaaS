'use client';
import { useEffect, useState } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import PageHeader from '@/components/admin/PageHeader';
import {
  Button, Card, CardHeader, Badge, EmptyState, StatusDot,
  Table, THead, TBody, TR, TH, TD, Skeleton,
} from '@/components/admin/ui';
import { Icon } from '@/components/marketing/icons';
import { adminFetch } from '@/lib/admin-api';

const REVENUE_TABS = [
  { label: 'Overview',      href: '/admin/revenue' },
  { label: 'Subscriptions', href: '/admin/subscriptions' },
  { label: 'Invoices',      href: '/admin/invoices' },
  { label: 'Tax rates',     href: '/admin/taxes' },
  { label: 'Discounts',     href: '/admin/discounts', active: true },
  { label: 'Plans',         href: '/admin/plans' },
];

export default function DiscountsPage() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/discount-codes')
      .then((r) => { setCodes(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function save(form) {
    try {
      const payload = { ...form, discount_value: parseFloat(form.discount_value), max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null };
      if (payload.id) await adminFetch(`/api/v1/admin/discount-codes/${payload.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      else await adminFetch('/api/v1/admin/discount-codes', { method: 'POST', body: JSON.stringify(payload) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this discount code?')) return;
    try { await adminFetch(`/api/v1/admin/discount-codes/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Discount codes"
          description="Promo codes redeemable by tenants during signup or upgrade. Scope to a specific plan, set usage limits, and define an expiry window."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Discounts' }]}
          tabs={REVENUE_TABS}
          actions={
            <Button onClick={() => setEditing({ code: '', name: '', discount_type: 'percent', discount_value: 20, scope: 'all', max_uses: '', valid_until: '', is_active: true })} variant="primary" size="sm">
              <Icon.Star className="h-3.5 w-3.5" /> New code
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <DiscountEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <Table>
          <THead><TH>Code</TH><TH>Discount</TH><TH>Scope</TH><TH align="right">Uses</TH><TH>Expires</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3,4].map((i) => (<TR key={i} hover={false}>{[1,2,3,4,5,6,7].map((c) => <TD key={c}><Skeleton height={14} className="w-20" /></TD>)}</TR>))}</TBody>
        </Table>
      ) : codes.length === 0 ? (
        <EmptyState
          icon={Icon.Star}
          title="No discount codes yet"
          description="Discount codes are an easy way to run promotions, reward early adopters, or close enterprise deals."
          action={<Button onClick={() => setEditing({ code: '', name: '', discount_type: 'percent', discount_value: 20, scope: 'all', max_uses: '', valid_until: '', is_active: true })} variant="primary" size="sm">Create first code</Button>}
        />
      ) : (
        <Table>
          <THead>
            <TH>Code</TH>
            <TH>Discount</TH>
            <TH>Scope</TH>
            <TH align="right">Uses</TH>
            <TH>Expires</TH>
            <TH>Status</TH>
            <TH />
          </THead>
          <TBody>
            {codes.map((c) => {
              const remaining = c.max_uses ? c.max_uses - c.used_count : null;
              return (
                <TR key={c.id}>
                  <TD>
                    <code className="font-mono text-sm font-bold rounded bg-amber-50 text-amber-800 px-2 py-0.5 ring-1 ring-amber-200">{c.code}</code>
                    <div className="text-xs text-dim mt-1">{c.name}</div>
                  </TD>
                  <TD className="font-semibold mono-num">
                    {c.discount_type === 'percent' ? `${parseFloat(c.discount_value).toFixed(0)}%` : `$${parseFloat(c.discount_value).toFixed(2)}`}
                    <span className="ml-1 text-xs text-muted font-normal">{c.discount_type}</span>
                  </TD>
                  <TD><Badge variant="blue">{c.scope}</Badge></TD>
                  <TD align="right" className="text-xs mono-num">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ' / ∞'}
                    {remaining != null && remaining < 10 && <div className="text-rose-600 text-[10px] mt-0.5">{remaining} left</div>}
                  </TD>
                  <TD className="text-xs text-muted mono-num">{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : 'Never'}</TD>
                  <TD><StatusDot color={c.is_active ? 'emerald' : 'gray'} label={c.is_active ? 'Active' : 'Disabled'} /></TD>
                  <TD align="right">
                    <div className="flex items-center justify-end gap-3 text-xs">
                      <button onClick={() => setEditing({ ...c, valid_until: c.valid_until?.slice(0, 10) || '' })} className="text-blue-600 hover:underline font-medium">Edit</button>
                      <button onClick={() => remove(c.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                    </div>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

function DiscountEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit code' : 'New discount code'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Code">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono uppercase" required maxLength={50} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Description">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="Black Friday 2025" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Type">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.discount_type} onChange={(e) => setForm((f) => ({ ...f, discount_type: e.target.value }))}>
              <option value="percent">Percent</option>
              <option value="flat">Flat ($)</option>
            </select>
          </Field>
          <Field label="Value">
            <input type="number" step="0.01" min="0" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" required value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: e.target.value }))} />
          </Field>
          <Field label="Scope">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}>
              <option value="all">All plans</option>
              <option value="plan:basic">Basic only</option>
              <option value="plan:pro">Pro only</option>
              <option value="plan:enterprise">Enterprise only</option>
            </select>
          </Field>
          <Field label="Max uses">
            <input type="number" min="1" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="∞" value={form.max_uses || ''} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Valid until">
            <input type="date" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.valid_until || ''} onChange={(e) => setForm((f) => ({ ...f, valid_until: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm pt-6">
            <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
          </label>
        </div>
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Button type="submit" variant="primary" size="sm">Save</Button>
          <button type="button" onClick={onCancel} className="text-sm text-muted">Cancel</button>
        </div>
      </form>
    </Card>
  );
}

function Field({ label, children }) {
  return (
    <label className="text-xs">
      <span className="block mb-1 text-muted font-semibold uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

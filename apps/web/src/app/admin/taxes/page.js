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
  { label: 'Tax rates',     href: '/admin/taxes', active: true },
  { label: 'Discounts',     href: '/admin/discounts' },
  { label: 'Plans',         href: '/admin/plans' },
];

export default function TaxesPage() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  function load() {
    setLoading(true);
    adminFetch('/api/v1/admin/tax-rates')
      .then((r) => { setRates(r.data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }
  useEffect(load, []);

  async function save(form) {
    try {
      if (form.id) await adminFetch(`/api/v1/admin/tax-rates/${form.id}`, { method: 'PATCH', body: JSON.stringify(form) });
      else await adminFetch('/api/v1/admin/tax-rates', { method: 'POST', body: JSON.stringify(form) });
      setEditing(null);
      load();
    } catch (e) { setError(e.message); }
  }

  async function remove(id) {
    if (!confirm('Delete this tax rate?')) return;
    try { await adminFetch(`/api/v1/admin/tax-rates/${id}`, { method: 'DELETE' }); load(); }
    catch (e) { setError(e.message); }
  }

  return (
    <AdminShell
      header={
        <PageHeader
          eyebrow="Revenue & Billing"
          title="Tax rates"
          description="Jurisdictional tax rates applied to invoices. Tenants automatically inherit the rate matching their service address."
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Revenue', href: '/admin/revenue' }, { label: 'Tax rates' }]}
          tabs={REVENUE_TABS}
          actions={
            <Button onClick={() => setEditing({ name: '', rate: 0, country: 'US', region: '', category: 'service', inclusive: false, is_active: true })} variant="primary" size="sm">
              <Icon.Layers className="h-3.5 w-3.5" /> New tax rate
            </Button>
          }
        />
      }
    >
      {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{error}</div>}

      {editing && <TaxEditor initial={editing} onCancel={() => setEditing(null)} onSave={save} />}

      {loading ? (
        <Table>
          <THead><TH>Name</TH><TH>Jurisdiction</TH><TH align="right">Rate</TH><TH>Category</TH><TH>Status</TH><TH /></THead>
          <TBody>{[1,2,3,4].map((i) => (<TR key={i} hover={false}>{[1,2,3,4,5,6].map((c) => <TD key={c}><Skeleton height={14} className="w-24" /></TD>)}</TR>))}</TBody>
        </Table>
      ) : rates.length === 0 ? (
        <EmptyState
          icon={Icon.Layers}
          title="No tax rates configured"
          description="Add a tax rate to start collecting tax on subscriptions and service bookings. Rates are applied based on the customer's service address."
          action={
            <Button onClick={() => setEditing({ name: '', rate: 0, country: 'US', region: '', category: 'service', inclusive: false, is_active: true })} variant="primary" size="sm">
              Add first tax rate
            </Button>
          }
        />
      ) : (
        <Table>
          <THead>
            <TH>Name</TH>
            <TH>Jurisdiction</TH>
            <TH align="right">Rate</TH>
            <TH>Category</TH>
            <TH>Status</TH>
            <TH />
          </THead>
          <TBody>
            {rates.map((r) => (
              <TR key={r.id}>
                <TD className="font-medium">{r.name}</TD>
                <TD>
                  <span className="font-mono text-xs">{r.country}{r.region ? ` · ${r.region}` : ''}</span>
                  {r.postal_code_prefix && <span className="ml-1 text-xs text-dim">({r.postal_code_prefix})</span>}
                </TD>
                <TD align="right" className="mono-num font-semibold">{(parseFloat(r.rate) * 100).toFixed(2)}%</TD>
                <TD><Badge variant="gray">{r.category}</Badge></TD>
                <TD><StatusDot color={r.is_active ? 'emerald' : 'gray'} label={r.is_active ? 'Active' : 'Disabled'} /></TD>
                <TD align="right">
                  <div className="flex items-center justify-end gap-3 text-xs">
                    <button onClick={() => setEditing(r)} className="text-blue-600 hover:underline font-medium">Edit</button>
                    <button onClick={() => remove(r.id)} className="text-rose-600 hover:underline font-medium">Delete</button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </AdminShell>
  );
}

function TaxEditor({ initial, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  return (
    <Card className="mb-6 border-blue-200 bg-blue-50/30">
      <CardHeader title={initial.id ? 'Edit tax rate' : 'New tax rate'} />
      <form onSubmit={(e) => { e.preventDefault(); onSave({ ...form, rate: parseFloat(form.rate) }); }} className="mt-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Name">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="California Sales Tax" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </Field>
          <Field label="Rate (decimal — 0.0875 = 8.75%)">
            <input type="number" step="0.0001" min="0" max="1" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
          </Field>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Country">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm font-mono" required maxLength={2} value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value.toUpperCase() }))} />
          </Field>
          <Field label="Region">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="CA, NY…" value={form.region || ''} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
          </Field>
          <Field label="ZIP prefix">
            <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="optional" value={form.postal_code_prefix || ''} onChange={(e) => setForm((f) => ({ ...f, postal_code_prefix: e.target.value }))} />
          </Field>
          <Field label="Category">
            <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
              <option value="service">Service</option>
              <option value="digital">Digital</option>
              <option value="physical">Physical</option>
            </select>
          </Field>
        </div>
        <div className="flex items-center gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form.inclusive} onChange={(e) => setForm((f) => ({ ...f, inclusive: e.target.checked }))} /> Inclusive (price contains tax)
          </label>
          <label className="flex items-center gap-2 text-sm">
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

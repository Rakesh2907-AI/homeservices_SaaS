'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminShell from '@/components/admin/AdminShell';
import { adminFetch } from '@/lib/admin-api';

const STATUS_STYLES = {
  pending:     'bg-amber-100 text-amber-700',
  confirmed:   'bg-blue-100 text-blue-700',
  in_progress: 'bg-violet-100 text-violet-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-rose-100 text-rose-700',
};

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = status ? `?status=${status}&limit=200` : '?limit=200';
    adminFetch(`/api/v1/admin/bookings${q}`).then((r) => setBookings(r.data)).catch((e) => setError(e.message));
  }, [status]);

  return (
    <AdminShell
      title="Bookings"
      subtitle="Every booking across every tenant."
      actions={<span className="text-sm text-gray-500">{bookings.length} results</span>}
    >
      {error && <div className="mb-4 rounded-md bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-700">{error}</div>}

      <div className="rounded-xl border border-gray-200 bg-white p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">Filter by status:</span>
        {['', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <button
            key={s || 'all'} onClick={() => setStatus(s)}
            className={`text-xs rounded-full px-3 py-1 font-medium transition ${
              status === s ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3">Scheduled</th>
                <th className="px-6 py-3">Tenant</th>
                <th className="px-6 py-3">Service</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="font-medium">{new Date(b.scheduled_at).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-500">{new Date(b.scheduled_at).toLocaleTimeString()}</div>
                  </td>
                  <td className="px-6 py-3">
                    <Link href={`/admin/tenants/${b.tenant_id}`} className="hover:text-blue-600">{b.business_name}</Link>
                    <div className="text-xs text-gray-500">{b.subdomain}</div>
                  </td>
                  <td className="px-6 py-3">{b.service_title || '—'}</td>
                  <td className="px-6 py-3">{b.customer_name || '—'}</td>
                  <td className="px-6 py-3"><span className={`text-xs rounded-full px-2 py-0.5 font-medium ${STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-700'}`}>{b.status.replace('_', ' ')}</span></td>
                  <td className="px-6 py-3 text-right font-mono">${b.quoted_price ?? '—'}</td>
                </tr>
              ))}
              {bookings.length === 0 && <tr><td colSpan="6" className="px-6 py-10 text-center text-sm text-gray-500">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

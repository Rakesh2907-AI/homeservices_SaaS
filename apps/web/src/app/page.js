'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSession } from '@/lib/api';

export default function Home() {
  const [session, setSession] = useState({});
  useEffect(() => { setSession(getSession()); }, []);

  return (
    <main className="max-w-4xl mx-auto px-6 py-20">
      <h1 className="text-5xl font-bold mb-4">
        Run your home services business — <span style={{ color: 'var(--brand-primary)' }}>your way</span>
      </h1>
      <p className="text-xl text-gray-600 mb-12">
        Branded customer portal, scheduling, pricing, and dispatch — set up in under 5 minutes.
      </p>

      <div className="flex gap-4">
        {session.token ? (
          <Link href="/dashboard" className="btn-primary">Go to dashboard →</Link>
        ) : (
          <>
            <Link href="/signup" className="btn-primary">Start free trial</Link>
            <Link href="/login" className="btn-secondary">Sign in</Link>
          </>
        )}
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          ['Custom branding', 'Pick a theme, upload your logo. Your customers see your brand, not ours.'],
          ['Flexible pricing', 'Flat fees, hourly rates, distance-based — model any pricing structure.'],
          ['Multi-tenant secure', 'Database-level isolation. Your data never touches another business.'],
        ].map(([t, d]) => (
          <div key={t} className="card">
            <h3 className="font-semibold mb-2">{t}</h3>
            <p className="text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </div>
    </main>
  );
}

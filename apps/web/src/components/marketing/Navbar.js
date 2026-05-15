'use client';
import Link from 'next/link';
import { useState } from 'react';

const LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/customers', label: 'Customers' },
  { href: '/blog', label: 'Blog' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="inline-block h-8 w-8 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500" />
          ServiceHub
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-gray-600 hover:text-gray-900 transition">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
          <Link href="/signup" className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition">
            Start free trial
          </Link>
        </div>

        <button className="md:hidden p-2 text-gray-700" onClick={() => setOpen((o) => !o)} aria-label="menu">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-gray-200 bg-white px-6 py-4 space-y-3">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="block text-sm text-gray-700" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <div className="pt-3 border-t flex gap-3">
            <Link href="/login" className="text-sm text-gray-600">Sign in</Link>
            <Link href="/signup" className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white">Start free trial</Link>
          </div>
        </div>
      )}
    </header>
  );
}

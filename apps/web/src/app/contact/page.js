'use client';
import { useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Section, Eyebrow, H2, Lead } from '@/components/marketing/Section';
import { AmbientBlobs, DotGrid, FeatureIcon } from '@/components/marketing/decorations';
import { Icon } from '@/components/marketing/icons';

const OFFICES = [
  { city: 'Portland, OR', address: '1234 SW Morrison St, Floor 4\nPortland, OR 97205', tag: 'Headquarters' },
  { city: 'Toronto, ON', address: '350 King St W, Suite 1200\nToronto, ON M5V 1J5', tag: 'Engineering' },
  { city: 'Remote', address: 'Distributed across 12 countries.\nWe hire where talented people are.', tag: 'Everywhere' },
];

const CHANNELS = [
  { Ico: Icon.MessageCircle, title: 'Sales', desc: 'Talk to someone about pricing, demos, or enterprise plans.', cta: 'sales@servicehub.app', gradient: 'from-blue-500 to-cyan-500' },
  { Ico: Icon.Phone, title: 'Support', desc: 'Existing customer? Our team replies in under 2 hours during business days.', cta: 'support@servicehub.app', gradient: 'from-emerald-500 to-teal-500' },
  { Ico: Icon.Handshake, title: 'Partnerships', desc: 'Integration partners, affiliates, and resellers.', cta: 'partners@servicehub.app', gradient: 'from-violet-500 to-purple-500' },
  { Ico: Icon.Newspaper, title: 'Press & media', desc: 'Press kit, exec bios, brand assets.', cta: 'press@servicehub.app', gradient: 'from-amber-500 to-orange-500' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', reason: 'demo', message: '' });
  const [submitted, setSubmitted] = useState(false);

  function update(k) { return (e) => setForm((f) => ({ ...f, [k]: e.target.value })); }
  function submit(e) {
    e.preventDefault();
    // In production this would POST to a CRM / Slack webhook. For demo: optimistic ack.
    setSubmitted(true);
  }

  return (
    <MarketingLayout>
      <section className="relative bg-white overflow-hidden">
        <AmbientBlobs />
        <DotGrid className="opacity-30" />
        <Section>
          <div className="text-center max-w-3xl mx-auto">
            <Eyebrow>Get in touch</Eyebrow>
            <H2 className="mx-auto">Let&apos;s talk</H2>
            <Lead className="mx-auto">Have a question, want a demo, or interested in partnering? We respond to every message within one business day.</Lead>
          </div>
        </Section>
      </section>

      {/* CONTACT FORM + CHANNELS */}
      <Section bg="gray">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="rounded-2xl bg-white border border-gray-200 p-8">
            {submitted ? (
              <div className="text-center py-12">
                <div className="inline-flex h-16 w-16 rounded-full bg-green-100 items-center justify-center mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Thanks, {form.name.split(' ')[0]}!</h3>
                <p className="text-gray-600">We got your message and will be in touch within one business day.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <h3 className="text-2xl font-bold text-gray-900">Send us a message</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
                    <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required value={form.name} onChange={update('name')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work email</label>
                    <input type="email" className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required value={form.email} onChange={update('email')} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.company} onChange={update('company')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What can we help with?</label>
                  <select className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={form.reason} onChange={update('reason')}>
                    <option value="demo">Schedule a demo</option>
                    <option value="sales">Pricing & sales question</option>
                    <option value="enterprise">Enterprise plan</option>
                    <option value="partnership">Partnership inquiry</option>
                    <option value="press">Press / media</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea rows={5} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required value={form.message} onChange={update('message')} />
                </div>

                <button type="submit" className="w-full rounded-md bg-gray-900 text-white py-3 font-medium hover:bg-gray-800 transition">
                  Send message
                </button>
                <p className="text-xs text-gray-500 text-center">By submitting, you agree to our <a href="/privacy" className="underline">privacy policy</a>.</p>
              </form>
            )}
          </div>

          {/* Channels */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Or reach us directly</h3>
            <div className="space-y-4">
              {CHANNELS.map((c) => (
                <div key={c.title} className="flex gap-4 rounded-lg bg-white border border-gray-200 p-5 lift">
                  <FeatureIcon gradient={c.gradient}>
                    <c.Ico className="h-6 w-6" />
                  </FeatureIcon>
                  <div>
                    <h4 className="font-semibold text-gray-900">{c.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{c.desc}</p>
                    <a href={`mailto:${c.cta}`} className="link-underline text-sm text-blue-600 font-medium mt-2 inline-block">{c.cta}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* OFFICES */}
      <Section>
        <div className="max-w-3xl mb-12">
          <Eyebrow>Where we are</Eyebrow>
          <H2>Our offices</H2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {OFFICES.map((o) => (
            <div key={o.city} className="group relative rounded-xl border border-gray-200 p-6 lift overflow-hidden">
              <div aria-hidden className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-blue-100 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity" />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Icon.Map className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">{o.tag}</span>
                </div>
                <h3 className="mt-2 text-xl font-bold text-gray-900">{o.city}</h3>
                <p className="mt-3 text-sm text-gray-600 whitespace-pre-line">{o.address}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </MarketingLayout>
  );
}

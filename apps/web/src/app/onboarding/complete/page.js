'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WizardShell from '@/components/WizardShell';
import { api } from '@/lib/api';

export default function CompleteStep() {
  const router = useRouter();

  useEffect(() => {
    api.completeStep('complete').catch(() => {});
  }, []);

  return (
    <WizardShell stepId="complete">
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full mb-6" style={{ background: 'var(--brand-primary)' }}>
          <span className="text-4xl text-white">✓</span>
        </div>
        <h2 className="text-3xl font-bold mb-2">You&apos;re all set!</h2>
        <p className="text-gray-600 mb-8">Your business is live. Start taking bookings or fine-tune your settings from the dashboard.</p>
        <button onClick={() => router.push('/dashboard')} className="btn-primary">
          Go to dashboard →
        </button>
      </div>
    </WizardShell>
  );
}

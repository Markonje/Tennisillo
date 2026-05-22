'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GlassCard, GlassInput, GlassSelect, Button, StepDots, Banner } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

const LEVELS = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'it';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ skillLevel: 'ROOKIE', birthYear: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleComplete() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post('/onboarding/complete', {
        skillLevel: form.skillLevel,
        birthYear: parseInt(form.birthYear),
        city: form.city || undefined,
      });
      router.push(`/${locale}/leagues`);
    } catch {
      setError("Impossibile completare l'onboarding. Riprova.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
      <GlassCard className="w-full max-w-md p-9">
        <h1 className="text-xl font-extrabold text-primary-glass text-center mb-2">
          {t('title')}
        </h1>
        <div className="flex justify-center mb-6">
          <StepDots total={3} current={step} />
        </div>

        {error && <Banner tone="danger" className="mb-4">{error}</Banner>}

        <div className="flex flex-col gap-4">
          {step === 0 && (
            <>
              <GlassSelect
                label={t('level')}
                value={form.skillLevel}
                onChange={(v) => setForm({ ...form, skillLevel: v })}
                options={LEVELS}
              />
              <Button onClick={() => setStep(1)} className="w-full">Avanti →</Button>
            </>
          )}

          {step === 1 && (
            <>
              <GlassInput
                label={t('birthYear')}
                type="number"
                placeholder="Es. 1990"
                value={form.birthYear}
                onChange={(v) => setForm({ ...form, birthYear: v })}
                min={1940}
                max={2015}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">← Indietro</Button>
                <Button onClick={() => setStep(2)} className="flex-1">Avanti →</Button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <GlassInput
                label={t('city')}
                placeholder="Es. Roma"
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setStep(1)} className="flex-1">← Indietro</Button>
                <Button
                  onClick={() => { void handleComplete(); }}
                  disabled={loading || !form.birthYear}
                  loading={loading}
                  className="flex-1"
                >
                  Completa
                </Button>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

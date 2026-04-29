'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

const LEVELS = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'];

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'it';
  const [step, setStep] = useState(1);
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
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1530 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <GlassCard style={{ width: '100%', maxWidth: 440, padding: '36px 32px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 8, textAlign: 'center' }}>
          {t('title')}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center', marginBottom: 28 }}>
          {step}/3
        </p>

        {error && (
          <p style={{ color: '#f09090', fontSize: 13, textAlign: 'center', marginBottom: 16 }}>{error}</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <>
              <p style={labelStyle}>{t('level')}</p>
              <select
                value={form.skillLevel}
                onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
                style={inputStyle}
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button style={btnStyle} onClick={() => setStep(2)}>Avanti →</button>
            </>
          )}

          {step === 2 && (
            <>
              <p style={labelStyle}>{t('birthYear')}</p>
              <input
                type="number"
                placeholder="Es. 1990"
                value={form.birthYear}
                onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                min={1940}
                max={2015}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', flex: 1 }} onClick={() => setStep(1)}>← Indietro</button>
                <button style={{ ...btnStyle, flex: 1 }} onClick={() => setStep(3)}>Avanti →</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p style={labelStyle}>{t('city')}</p>
              <input
                placeholder="Es. Roma"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={{ ...btnStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', flex: 1 }} onClick={() => setStep(2)}>← Indietro</button>
                <button
                  style={{ ...btnStyle, flex: 1 }}
                  onClick={() => { void handleComplete(); }}
                  disabled={loading || !form.birthYear}
                >
                  {loading ? '…' : 'Completa'}
                </button>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 14, color: 'rgba(255,255,255,0.7)', fontWeight: 600, margin: 0 };
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '11px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};
const btnStyle: React.CSSProperties = {
  background: '#b0ef60',
  color: '#0a0e1a',
  border: 'none',
  borderRadius: 10,
  padding: '12px',
  fontWeight: 700,
  fontSize: 14,
  cursor: 'pointer',
  width: '100%',
};

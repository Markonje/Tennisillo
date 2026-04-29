'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface CreatedLeague {
  id: string;
}

export default function NewLeaguePage() {
  const t = useTranslations('createLeague');
  const router = useRouter();
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? 'it';

  const [form, setForm] = useState({
    name: '',
    sport: 'TENNIS_SINGLES',
    type: 'PUBLIC',
    description: '',
    maxMembers: 50,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const league = await apiClient.post<CreatedLeague>('/leagues', {
        name: form.name,
        sport: form.sport,
        type: form.type,
        ...(form.description && { description: form.description }),
      });
      router.push(`/${locale}/leagues/${league.id}`);
    } catch {
      setError('Impossibile creare la lega. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
        {t('title')}
      </h1>

      <GlassCard style={{ padding: 28, maxWidth: 520 }}>
        <form onSubmit={(e) => { void handleSubmit(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={labelStyle}>
            {t('name')}
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              maxLength={80}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            {t('sport')}
            <select
              value={form.sport}
              onChange={(e) => setForm({ ...form, sport: e.target.value })}
              style={inputStyle}
            >
              <option value="TENNIS_SINGLES">Tennis Singles</option>
              <option value="TENNIS_DOUBLES">Tennis Doubles</option>
              <option value="PADEL">Padel</option>
            </select>
          </label>

          <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend style={{ ...labelStyle, display: 'block', marginBottom: 8 }}>{t('type')}</legend>
            <div style={{ display: 'flex', gap: 12 }}>
              {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
                <label
                  key={v}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: 14,
                    fontWeight: form.type === v ? 700 : 400,
                  }}
                >
                  <input
                    type="radio"
                    name="type"
                    value={v}
                    checked={form.type === v}
                    onChange={() => setForm({ ...form, type: v })}
                    style={{ accentColor: '#b0ef60' }}
                  />
                  {v === 'PUBLIC' ? t('public') : t('private')}
                </label>
              ))}
            </div>
          </fieldset>

          <label style={labelStyle}>
            {t('description')}
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={500}
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
            />
          </label>

          {error && <p style={{ color: '#f09090', fontSize: 13, margin: 0 }}>{error}</p>}

          <button type="submit" disabled={loading || !form.name.trim()} style={btnStyle}>
            {loading ? '…' : t('create')}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
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
};

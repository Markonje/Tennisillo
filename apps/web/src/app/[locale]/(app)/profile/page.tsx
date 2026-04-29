'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

const LEVELS = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'];

interface UserProfile {
  id: string;
  displayName: string;
  city?: string;
  birthYear?: number;
  globalLevel: string;
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ displayName: '', city: '', birthYear: 0, globalLevel: 'ROOKIE' });
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiClient.get<UserProfile>('/users/me');
        setProfile(data);
        setForm({
          displayName: data.displayName,
          city: data.city ?? '',
          birthYear: data.birthYear ?? 0,
          globalLevel: data.globalLevel,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('401') || msg.includes('403')) {
          setSessionExpired(true);
        } else {
          setError('Impossibile caricare il profilo.');
        }
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    try {
      const payload = {
        ...(form.displayName && { displayName: form.displayName }),
        ...(form.city && { city: form.city }),
        ...(form.birthYear > 0 && { birthYear: form.birthYear }),
        globalLevel: form.globalLevel,
      };
      await apiClient.put('/users/me', payload);
      setSaved(true);
    } catch {
      setError('Impossibile salvare il profilo.');
    }
  }

  if (sessionExpired) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
          {t('title')}
        </h1>
        <GlassCard style={{ padding: 24, maxWidth: 480 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            Sessione scaduta. Ricarica la pagina per continuare.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
          {t('title')}
        </h1>
        {error ? (
          <p style={{ color: '#f09090', fontSize: 13 }}>{error}</p>
        ) : (
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>Caricamento…</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
        {t('title')}
      </h1>

      <GlassCard style={{ padding: 24, maxWidth: 480 }}>
        <form onSubmit={(e) => { void handleSave(e); }} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>
            Nome
            <input
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              maxLength={50}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Città
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              maxLength={100}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Anno di nascita
            <input
              type="number"
              value={form.birthYear || ''}
              onChange={(e) => setForm({ ...form, birthYear: parseInt(e.target.value) || 0 })}
              min={1940}
              max={2015}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Livello
            <select
              value={form.globalLevel}
              onChange={(e) => setForm({ ...form, globalLevel: e.target.value })}
              style={inputStyle}
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </label>

          {error && <p style={{ color: '#f09090', fontSize: 13 }}>{error}</p>}
          {saved && <p style={{ color: '#b0ef60', fontSize: 13 }}>Salvato!</p>}

          <button type="submit" style={btnStyle}>{t('save')}</button>
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

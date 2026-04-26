'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@tennisillo/ui';
import { createClient } from '../../../../lib/supabase/client';

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
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';

  async function getToken() {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? '';
  }

  useEffect(() => {
    void (async () => {
      const token = await getToken();
      const res = await fetch(`${apiUrl}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json() as UserProfile;
        setProfile(data);
        setForm({
          displayName: data.displayName,
          city: data.city ?? '',
          birthYear: data.birthYear ?? 0,
          globalLevel: data.globalLevel,
        });
      }
    })();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = await getToken();
    const payload = {
      ...(form.displayName && { displayName: form.displayName }),
      ...(form.city && { city: form.city }),
      ...(form.birthYear > 0 && { birthYear: form.birthYear }),
      globalLevel: form.globalLevel,
    };
    const res = await fetch(`${apiUrl}/users/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) setSaved(true);
  }

  if (!profile) {
    return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Caricamento…</p>;
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

          {saved && (
            <p style={{ color: '#b0ef60', fontSize: 13 }}>Salvato!</p>
          )}

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

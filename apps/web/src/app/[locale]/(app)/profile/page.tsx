'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard, GlassInput, GlassSelect, Button, Banner } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

const LEVELS = ['ROOKIE', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'ELITE'];

interface UserProfile {
  id: string;
  displayName: string;
  city?: string;
  birthYear?: number;
  globalLevel: string;
}

interface EarnedBadge {
  id: string;
  earnedAt: string;
  achievement: { code: string; name: string; description: string };
}

export default function ProfilePage() {
  const t = useTranslations('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<EarnedBadge[]>([]);
  const [form, setForm] = useState({ displayName: '', city: '', birthYear: '', globalLevel: 'ROOKIE' });
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
          birthYear: data.birthYear ? String(data.birthYear) : '',
          globalLevel: data.globalLevel,
        });
        try {
          setBadges(await apiClient.get<EarnedBadge[]>('/users/me/achievements'));
        } catch {
          // badges are decorative: never block the profile on failure
        }
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
        ...(form.birthYear && { birthYear: parseInt(form.birthYear) }),
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
        <h1 className="text-2xl font-extrabold text-primary-glass mb-6">{t('title')}</h1>
        <GlassCard className="p-6 max-w-md">
          <p className="text-tertiary-glass m-0">
            Sessione scaduta. Ricarica la pagina per continuare.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold text-primary-glass mb-6">{t('title')}</h1>
        {error
          ? <Banner tone="danger">{error}</Banner>
          : <p className="text-tertiary-glass">Caricamento…</p>
        }
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass mb-6">{t('title')}</h1>
      <GlassCard className="p-6 max-w-md">
        <form onSubmit={(e) => { void handleSave(e); }} className="flex flex-col gap-4">
          <GlassInput
            label="Nome"
            value={form.displayName}
            onChange={(v) => setForm({ ...form, displayName: v })}
            maxLength={50}
          />
          <GlassInput
            label="Città"
            value={form.city}
            onChange={(v) => setForm({ ...form, city: v })}
            maxLength={100}
          />
          <GlassInput
            label="Anno di nascita"
            type="number"
            value={form.birthYear}
            onChange={(v) => setForm({ ...form, birthYear: v })}
            min={1940}
            max={2015}
          />
          <GlassSelect
            label="Livello"
            value={form.globalLevel}
            onChange={(v) => setForm({ ...form, globalLevel: v })}
            options={LEVELS}
          />

          {error && <Banner tone="danger">{error}</Banner>}
          {saved && <Banner tone="success">Salvato!</Banner>}

          <Button type="submit" className="w-full">{t('save')}</Button>
        </form>
      </GlassCard>

      {badges.length > 0 && (
        <GlassCard className="p-6 max-w-md mt-5">
          <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3">{t('badges')}</h2>
          <div className="flex flex-col gap-2.5">
            {badges.map((b) => (
              <div key={b.id} className="flex items-center gap-3">
                <span className="text-xl">🏅</span>
                <div>
                  <div className="text-sm font-semibold text-primary-glass">
                    {b.achievement.name}
                  </div>
                  <div className="text-xs text-tertiary-glass">{b.achievement.description}</div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { KpiCard } from '@tennisillo/ui';

interface UserProfile {
  id: string;
  displayName: string;
  globalLevel: string;
  globalRating: number;
  globalExperiencePoints: number;
  reputationScore: number;
}

interface DashboardClientProps {
  userEmail?: string;
  profile: UserProfile | null;
}

export function DashboardClient({ userEmail, profile }: DashboardClientProps) {
  const t = useTranslations('dashboard');
  const displayName = profile?.displayName ?? userEmail?.split('@')[0] ?? 'Player';

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {t('greeting', { name: displayName })}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginTop: 6, fontSize: 14 }}>
          {t('subtitle')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
        <KpiCard icon="🏆" label="Ranking" value={profile?.globalLevel ?? '—'} />
        <KpiCard icon="⭐" label="Rating" value={profile ? Math.round(profile.globalRating) : '—'} />
        <KpiCard icon="🎮" label="XP" value={profile?.globalExperiencePoints ?? 0} />
        <KpiCard
          icon="🤝"
          label="Reputazione"
          value={profile ? `${Math.round(profile.reputationScore)}` : '—'}
        />
      </div>
    </div>
  );
}

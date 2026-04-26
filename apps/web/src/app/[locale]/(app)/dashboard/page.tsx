import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { createClient } from '../../../../lib/supabase/server';
import { KpiCard } from '@tennisillo/ui';

interface UserProfile {
  id: string;
  displayName: string;
  globalLevel: string;
  globalRating: number;
  globalExperiencePoints: number;
  reputationScore: number;
}

async function fetchUserProfile(accessToken: string): Promise<UserProfile | null> {
  const apiUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
  try {
    const res = await fetch(`${apiUrl}/users/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json() as Promise<UserProfile>;
  } catch {
    return null;
  }
}

export default async function DashboardPage() {
  const locale = await getLocale();
  const t = await getTranslations('dashboard');
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const profile = session.access_token ? await fetchUserProfile(session.access_token) : null;
  const displayName = profile?.displayName ?? session.user.email?.split('@')[0] ?? 'Player';

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
        <KpiCard
          icon="🏆"
          label="Ranking"
          value={profile?.globalLevel ?? '—'}
        />
        <KpiCard
          icon="⭐"
          label="Rating"
          value={profile ? Math.round(profile.globalRating) : '—'}
        />
        <KpiCard
          icon="🎮"
          label="XP"
          value={profile?.globalExperiencePoints ?? 0}
        />
        <KpiCard
          icon="🤝"
          label="Reputazione"
          value={profile ? `${Math.round(profile.reputationScore)}` : '—'}
        />
      </div>
    </div>
  );
}

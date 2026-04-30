import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { GlassCard } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { SeasonPlayerEntry } from '@tennisillo/shared-types';

interface Props {
  params: { leagueId: string; seasonId: string };
}

export default async function SeasonPlayersPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('season');

  const players = await apiServer.get<SeasonPlayerEntry[]>(`/seasons/${seasonId}/players`);

  if (!players) {
    redirect(`/${locale}/leagues/${leagueId}/seasons/${seasonId}`);
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 20 }}>
        {t('players')}
      </h1>

      {players.length === 0 ? (
        <GlassCard style={{ padding: '28px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0 }}>Nessun iscritto ancora.</p>
        </GlassCard>
      ) : (
        <GlassCard style={{ padding: '8px 0' }}>
          {players.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 22px',
                borderBottom: i < players.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(176,239,96,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#b0ef60',
                  flexShrink: 0,
                }}
              >
                {p.displayName[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                  {p.displayName}
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>@{p.username}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                  {t('joinedAt')}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
                  {new Date(p.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

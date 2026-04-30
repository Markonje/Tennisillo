import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { SeasonPlayerEntry, SeasonRankingEntry } from '@tennisillo/shared-types';
import type { SeasonContextValue } from '@/lib/season-context';
import { SeasonDashboardClient } from './SeasonDashboardClient';

interface Props {
  params: { leagueId: string; seasonId: string };
}

function weeksElapsed(startsAt: string): number {
  const start = new Date(startsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)));
}

export default async function SeasonDashboardPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('season');

  const [season, players, ranking] = await Promise.all([
    apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`),
    apiServer.get<SeasonPlayerEntry[]>(`/seasons/${seasonId}/players`),
    apiServer.get<SeasonRankingEntry[]>(`/seasons/${seasonId}/ranking`),
  ]);

  if (!season) return <p style={{ color: 'rgba(255,255,255,0.4)' }}>{t('notFound')}</p>;

  const safeRanking = ranking ?? [];
  const safePlayers = players ?? [];
  const topPlayers = safePlayers.slice(0, 5);

  const weekElapsed = season.startsAt ? weeksElapsed(season.startsAt) : 0;
  const totalWeeks = season.plannedDurationWeeks ?? null;

  const statusKey = `status.${season.status}` as `status.DRAFT` | `status.REGISTRATION` | `status.ACTIVE` | `status.COMPLETED`;
  const statusLabel = t(statusKey);
  const statusColors: Record<string, string> = {
    DRAFT: 'rgba(255,255,255,0.5)',
    REGISTRATION: '#64b4ff',
    ACTIVE: '#b0ef60',
    COMPLETED: 'rgba(255,255,255,0.35)',
  };
  const statusColor = statusColors[season.status] ?? 'rgba(255,255,255,0.5)';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            {season.name}
          </h1>
          <span
            style={{
              background: `${statusColor}1a`,
              color: statusColor,
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('playersCount')}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            {season.playerCount}
            {season.maxPlayers ? <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/{season.maxPlayers}</span> : null}
          </p>
        </GlassCard>

        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Status
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: statusColor, margin: 0 }}>
            {statusLabel}
          </p>
        </GlassCard>

        {season.status === 'ACTIVE' && totalWeeks && (
          <GlassCard style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('week')}
            </p>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
              {weekElapsed}
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>/{totalWeeks}</span>
            </p>
          </GlassCard>
        )}

        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('matches')}
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
            {t('matchesPlaceholder')}
          </p>
        </GlassCard>
      </div>

      {/* Client component handles admin actions + member registration */}
      <SeasonDashboardClient
        season={season}
        locale={locale}
        playerCount={season.playerCount}
      />

      {/* Players preview */}
      {topPlayers.length > 0 && (
        <GlassCard style={{ padding: '20px 22px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
              {t('players')}
            </h2>
            {safePlayers.length > 5 && (
              <a
                href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/players`}
                style={{ fontSize: 13, color: '#b0ef60', textDecoration: 'none' }}
              >
                {t('seeAll')} ({safePlayers.length})
              </a>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topPlayers.map((p: SeasonPlayerEntry) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'rgba(176,239,96,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#b0ef60',
                  }}
                >
                  {p.displayName[0]?.toUpperCase()}
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>{p.displayName}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
                  @{p.username}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Ranking */}
      <GlassCard style={{ padding: '20px 22px' }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '0 0 14px' }}>
          {t('ranking')}
        </h2>
        {season.status === 'DRAFT' || season.status === 'REGISTRATION' ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
            {t('rankingPlaceholderRegistration')}
          </p>
        ) : safeRanking.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, margin: 0 }}>
            {t('rankingPlaceholderRegistration')}
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {safeRanking.map((r: SeasonRankingEntry, i: number) => (
                <div
                  key={r.id}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < safeRanking.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                >
                  <span style={{ width: 28, fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                    {r.rank ?? '—'}
                  </span>
                  <span style={{ flex: 1, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>
                    {r.displayName}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#b0ef60' }}>
                    {r.points} pt
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', margin: '12px 0 0' }}>
              {t('rankingPlaceholderScoring')}
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}

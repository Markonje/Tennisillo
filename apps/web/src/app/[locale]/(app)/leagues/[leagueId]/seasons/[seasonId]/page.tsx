import { getLocale, getTranslations } from 'next-intl/server';
import { GlassCard, KpiCard, Badge, Avatar } from '@tennisillo/ui';
import Link from 'next/link';
import { apiServer } from '@/lib/api-server';
import type { SeasonPlayerEntry, SeasonRankingEntry, SeasonStatus } from '@tennisillo/shared-types';
import type { SeasonContextValue } from '@/lib/season-context';
import type { MatchDto } from '@/lib/match-types';
import { formatSets } from '@/lib/match-types';
import { SeasonDashboardClient } from './SeasonDashboardClient';

interface Props {
  params: { leagueId: string; seasonId: string };
}

function weeksElapsed(startsAt: string): number {
  const start = new Date(startsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)));
}

function statusTone(status: SeasonStatus): 'green' | 'blue' | 'gray' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'REGISTRATION') return 'blue';
  return 'gray';
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export default async function SeasonDashboardPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('season');
  const tMatches = await getTranslations('matches');

  const [season, players, ranking, matches] = await Promise.all([
    apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`),
    apiServer.get<SeasonPlayerEntry[]>(`/seasons/${seasonId}/players`),
    apiServer.get<SeasonRankingEntry[]>(`/seasons/${seasonId}/ranking`),
    apiServer.get<MatchDto[]>(`/seasons/${seasonId}/matches`),
  ]);

  if (!season) return <p className="text-tertiary-glass">{t('notFound')}</p>;

  const safeRanking = ranking ?? [];
  const safePlayers = players ?? [];
  const safeMatches = matches ?? [];
  const recentMatches = safeMatches.slice(0, 5);
  const topPlayers = safePlayers.slice(0, 5);

  const weekElapsed = season.startsAt ? weeksElapsed(season.startsAt) : 0;
  const totalWeeks = season.plannedDurationWeeks ?? null;

  const statusKey = `status.${season.status}` as
    | 'status.DRAFT'
    | 'status.REGISTRATION'
    | 'status.ACTIVE'
    | 'status.COMPLETED';
  const statusLabel = t(statusKey);

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <h1 className="text-2xl font-extrabold text-primary-glass m-0">{season.name}</h1>
          <Badge tone={statusTone(season.status)} dot>
            {statusLabel}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5 mb-7">
        <KpiCard
          icon="👥"
          label={t('playersCount')}
          value={season.maxPlayers ? `${season.playerCount}/${season.maxPlayers}` : season.playerCount}
        />
        {season.status === 'ACTIVE' && totalWeeks && (
          <KpiCard
            icon="📅"
            label={t('week')}
            value={`${weekElapsed}/${totalWeeks}`}
          />
        )}
        <KpiCard icon="🎾" label={t('matches')} value={safeMatches.length} />
      </div>

      <SeasonDashboardClient season={season} locale={locale} playerCount={season.playerCount} />

      <GlassCard className="px-5 py-5 mb-5">
        <div className="flex justify-between items-center mb-3.5">
          <h2 className="text-sm font-bold text-secondary-glass m-0">{tMatches('title')}</h2>
          <div className="flex items-center gap-4">
            {season.status === 'ACTIVE' && (
              <Link
                href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/new`}
                className="text-xs text-accent-light no-underline hover:underline"
              >
                {tMatches('newChallenge')}
              </Link>
            )}
            {safeMatches.length > 0 && (
              <Link
                href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches`}
                className="text-xs text-accent-light no-underline hover:underline"
              >
                {tMatches('seeAll')} ({safeMatches.length})
              </Link>
            )}
          </div>
        </div>
        {recentMatches.length === 0 ? (
          <p className="text-tertiary-glass text-sm m-0">{tMatches('empty')}</p>
        ) : (
          <div className="flex flex-col">
            {recentMatches.map((m, i) => (
              <Link
                key={m.id}
                href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/${m.id}`}
                className={`flex items-center gap-3 py-2.5 no-underline hover:bg-white/[0.04] -mx-2 px-2 rounded-[10px] transition-colors ${
                  i < recentMatches.length - 1 ? 'border-b border-glass' : ''
                }`}
              >
                <span className="flex-1 text-sm text-secondary-glass truncate">
                  {m.player1.displayName} {tMatches('vs')} {m.player2.displayName}
                </span>
                {m.result && (
                  <span className="text-xs font-bold text-primary-glass">
                    {formatSets(m.result.sets)}
                  </span>
                )}
                <Badge
                  tone={
                    m.status === 'VALIDATED'
                      ? 'green'
                      : m.status === 'DISPUTED'
                        ? 'red'
                        : m.status === 'PENDING_VALIDATION'
                          ? 'yellow'
                          : m.status === 'SCHEDULED' || m.status === 'PENDING_RESULT'
                            ? 'blue'
                            : 'gray'
                  }
                  dot
                >
                  {tMatches(`status.${m.status}`)}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </GlassCard>

      {topPlayers.length > 0 && (
        <GlassCard className="px-5 py-5 mb-5">
          <div className="flex justify-between items-center mb-3.5">
            <h2 className="text-sm font-bold text-secondary-glass m-0">{t('players')}</h2>
            {safePlayers.length > 5 && (
              <Link
                href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/players`}
                className="text-xs text-accent-light no-underline hover:underline"
              >
                {t('seeAll')} ({safePlayers.length})
              </Link>
            )}
          </div>
          <div className="flex flex-col gap-2">
            {topPlayers.map((p: SeasonPlayerEntry) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <Avatar
                  initials={p.displayName[0] ?? '?'}
                  hue={nameToHue(p.displayName)}
                  size={32}
                />
                <span className="text-sm text-secondary-glass">{p.displayName}</span>
                <span className="text-xs text-tertiary-glass ml-auto">@{p.username}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3.5">{t('ranking')}</h2>
        {season.status === 'DRAFT' || season.status === 'REGISTRATION' ? (
          <p className="text-tertiary-glass text-sm m-0">{t('rankingPlaceholderRegistration')}</p>
        ) : safeRanking.length === 0 ? (
          <p className="text-tertiary-glass text-sm m-0">{t('rankingPlaceholderRegistration')}</p>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {safeRanking.map((r: SeasonRankingEntry, i: number) => (
                <div
                  key={r.id}
                  className={`flex items-center gap-3 py-2 ${
                    i < safeRanking.length - 1 ? 'border-b border-glass' : ''
                  }`}
                >
                  <span className="w-7 text-sm text-tertiary-glass font-semibold">
                    {r.rank ?? '—'}
                  </span>
                  <span className="flex-1 text-sm text-secondary-glass">{r.displayName}</span>
                  <span className="text-sm font-bold text-accent-light">{r.points} pt</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-glass mt-3 mb-0">
              {t('rankingPlaceholderScoring')}
            </p>
          </>
        )}
      </GlassCard>
    </div>
  );
}

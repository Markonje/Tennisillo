import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { GlassCard, Badge, EmptyState } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { SeasonSummary, SeasonStatus } from '@tennisillo/shared-types';

interface Props {
  params: { leagueId: string };
}

function statusTone(status: SeasonStatus): 'green' | 'blue' | 'gray' {
  if (status === 'ACTIVE') return 'green';
  if (status === 'REGISTRATION') return 'blue';
  return 'gray';
}

export default async function SeasonsPage({ params }: Props) {
  const { leagueId } = params;
  const locale = await getLocale();
  const t = await getTranslations('seasons');
  const tSeason = await getTranslations('season');

  const seasons = await apiServer.get<SeasonSummary[]>(`/leagues/${leagueId}/seasons`);

  if (!seasons) {
    redirect(`/${locale}/leagues`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-primary-glass m-0">{t('title')}</h1>
        <Link
          href={`/${locale}/leagues/${leagueId}/seasons/new`}
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-btn bg-gradient-to-br from-accent-light to-accent-dark text-[#0a1a0e] text-sm font-bold shadow-accent-glow hover:shadow-accent-glow-lg hover:-translate-y-px transition-all duration-150 no-underline"
        >
          {t('create')}
        </Link>
      </div>

      {seasons.length === 0 ? (
        <EmptyState icon="🏆" title={t('empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/${locale}/leagues/${leagueId}/seasons/${season.id}`}
              className="no-underline"
            >
              <GlassCard interactive className="px-[22px] py-[18px]">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-base font-bold text-primary-glass">{season.name}</span>
                  <Badge tone={statusTone(season.status)}>
                    {tSeason(`status.${season.status}`)}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-tertiary-glass">
                  <span>
                    {season.startsAt && season.endsAt
                      ? `${new Date(season.startsAt).toLocaleDateString()} – ${new Date(season.endsAt).toLocaleDateString()}`
                      : t('noDates')}
                  </span>
                  <span>
                    {tSeason('playersCount')}: {season.playerCount}
                    {season.maxPlayers ? `/${season.maxPlayers}` : ''}
                  </span>
                  {season.plannedDurationWeeks && (
                    <span>{season.plannedDurationWeeks} {tSeason('weeks')}</span>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

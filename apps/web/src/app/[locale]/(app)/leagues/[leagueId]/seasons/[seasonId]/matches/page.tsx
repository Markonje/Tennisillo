import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Button } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { MatchDto } from '@/lib/match-types';
import type { SeasonContextValue } from '@/lib/season-context';
import { MatchesListClient } from './MatchesListClient';

interface Props {
  params: { leagueId: string; seasonId: string };
}

export default async function MatchesPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('matches');
  const tSmart = await getTranslations('smartMatch');

  const [season, matches] = await Promise.all([
    apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`),
    apiServer.get<MatchDto[]>(`/seasons/${seasonId}/matches`),
  ]);

  const canChallenge = season?.status === 'ACTIVE';

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-extrabold text-primary-glass m-0">{t('title')}</h1>
        {canChallenge && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Link href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/find`}>
              <Button variant="secondary">{tSmart('title')}</Button>
            </Link>
            <Link href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/new`}>
              <Button>{t('newChallenge')}</Button>
            </Link>
          </div>
        )}
      </div>

      <MatchesListClient
        matches={matches ?? []}
        locale={locale}
        leagueId={leagueId}
        seasonId={seasonId}
        canChallenge={canChallenge}
      />
    </div>
  );
}

import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import type { SeasonContextValue } from '@/lib/season-context';
import type { SeasonPlayerEntry } from '@tennisillo/shared-types';
import { NewChallengeClient } from './NewChallengeClient';

interface Props {
  params: { leagueId: string; seasonId: string };
}

interface MeDto {
  id: string;
  username: string;
}

export default async function NewChallengePage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('challenges');

  const [season, players, me] = await Promise.all([
    apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`),
    apiServer.get<SeasonPlayerEntry[]>(`/seasons/${seasonId}/players`),
    apiServer.get<MeDto>('/users/me'),
  ]);

  if (!season || season.status !== 'ACTIVE') {
    redirect(`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches`);
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-6">{t('title')}</h1>
      <NewChallengeClient
        players={players ?? []}
        meUsername={me?.username ?? ''}
        locale={locale}
        leagueId={leagueId}
        seasonId={seasonId}
      />
    </div>
  );
}

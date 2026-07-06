import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import type { SeasonContextValue } from '@/lib/season-context';
import { SmartMatchClient, type SmartMatchCandidate } from './SmartMatchClient';

interface Props {
  params: { leagueId: string; seasonId: string };
}

export default async function SmartMatchPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('smartMatch');

  const season = await apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`);
  if (!season || season.status !== 'ACTIVE') {
    redirect(`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches`);
  }

  const candidates = await apiServer.get<SmartMatchCandidate[]>(
    `/seasons/${seasonId}/matchmaking/candidates?limit=10`,
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-2">{t('title')}</h1>
      <p className="text-sm text-tertiary-glass mt-0 mb-6">{t('hint')}</p>
      <SmartMatchClient
        leagueId={leagueId}
        seasonId={seasonId}
        locale={locale}
        initialCandidates={candidates ?? []}
      />
    </div>
  );
}

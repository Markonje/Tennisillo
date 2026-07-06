import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { apiServer } from '@/lib/api-server';
import type { MatchDto } from '@/lib/match-types';
import type { LeagueContextValue } from '@/lib/league-context';
import { MatchDetailClient } from './MatchDetailClient';

interface Props {
  params: { leagueId: string; seasonId: string; matchId: string };
}

interface MeDto {
  id: string;
}

export default async function MatchDetailPage({ params }: Props) {
  const { leagueId, seasonId, matchId } = params;
  const locale = await getLocale();
  const t = await getTranslations('matches');

  const [match, me, league] = await Promise.all([
    apiServer.get<MatchDto>(`/matches/${matchId}`),
    apiServer.get<MeDto>('/users/me'),
    apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`),
  ]);

  if (!match || match.seasonId !== seasonId) {
    return <p className="text-tertiary-glass">{t('notFound')}</p>;
  }

  const meId = me?.id ?? '';
  const isAdmin =
    (league?.members ?? []).some((m) => m.user.id === meId && m.role === 'ADMIN') ?? false;

  return (
    <div>
      <Link
        href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches`}
        className="inline-block mb-4 text-xs text-tertiary-glass no-underline hover:text-secondary-glass"
      >
        ← {t('title')}
      </Link>

      <MatchDetailClient match={match} meId={meId} isAdmin={isAdmin} locale={locale} />
    </div>
  );
}

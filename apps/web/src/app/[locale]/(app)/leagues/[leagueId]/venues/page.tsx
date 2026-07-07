import { getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';
import {
  VenuesClient,
  type FavoriteDto,
  type ProposalDto,
  type VenueDto,
} from './VenuesClient';

interface Props {
  params: { leagueId: string };
}

interface MeDto {
  id: string;
}

export default async function VenuesPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('venues');

  const [me, league, venues, favorites] = await Promise.all([
    apiServer.get<MeDto>('/users/me'),
    apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`),
    apiServer.get<VenueDto[]>(`/leagues/${leagueId}/venues`),
    apiServer.get<FavoriteDto[]>(`/leagues/${leagueId}/members/me/favorite-venues`),
  ]);

  const isAdmin = (league?.members ?? []).some(
    (m) => m.user.id === me?.id && m.role === 'ADMIN',
  );
  const proposals = isAdmin
    ? await apiServer.get<ProposalDto[]>(`/leagues/${leagueId}/venue-proposals`)
    : null;

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-6">{t('title')}</h1>
      <VenuesClient
        leagueId={leagueId}
        isAdmin={isAdmin}
        venues={venues ?? []}
        favorites={favorites ?? []}
        proposals={proposals ?? []}
      />
    </div>
  );
}

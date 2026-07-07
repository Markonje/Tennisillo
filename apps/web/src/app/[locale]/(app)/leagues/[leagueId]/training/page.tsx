import { getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';
import {
  TrainingClient,
  type MasterEntry,
  type TrainingSessionDto,
  type XpSummary,
} from './TrainingClient';

interface Props {
  params: { leagueId: string };
}

interface MeDto {
  id: string;
}

export default async function TrainingPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('training');

  const [me, league, sessions, mastersList, xp] = await Promise.all([
    apiServer.get<MeDto>('/users/me'),
    apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`),
    apiServer.get<TrainingSessionDto[]>(`/leagues/${leagueId}/sparring`),
    apiServer.get<MasterEntry[]>(`/leagues/${leagueId}/masters`),
    apiServer.get<XpSummary>('/users/me/global-xp'),
  ]);

  const meId = me?.id ?? '';
  const myMembership = (league?.members ?? []).find((m) => m.user.id === meId);
  const isAdmin = myMembership?.role === 'ADMIN';
  const members = (league?.members ?? [])
    .filter((m) => m.isActive && m.user.id !== meId)
    .map((m) => ({ memberId: m.id, userId: m.user.id, displayName: m.user.displayName }));

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-2">{t('title')}</h1>
      <p className="text-sm text-tertiary-glass mt-0 mb-6">{t('hint')}</p>
      <TrainingClient
        leagueId={leagueId}
        meId={meId}
        isAdmin={isAdmin}
        members={members}
        masters={mastersList ?? []}
        sessions={sessions ?? []}
        xp={xp}
      />
    </div>
  );
}

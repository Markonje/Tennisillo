import { getTranslations, getLocale } from 'next-intl/server';
import { KpiCard, Badge } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';
import { LeagueDashboardClient } from './LeagueDashboardClient';

interface Props {
  params: { leagueId: string };
}

export default async function LeagueDashboardPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('league');
  const locale = await getLocale();

  const league = await apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`);

  if (!league) {
    return <p className="text-tertiary-glass">Lega non trovata.</p>;
  }

  const memberCount = league.members?.length ?? 0;
  const topMembers = (league.members ?? []).slice(0, 5);

  return (
    <div>
      <div className="mb-7">
        <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
          <h1 className="text-[26px] font-extrabold text-primary-glass m-0">{league.name}</h1>
          <Badge tone="green">{league.sport}</Badge>
          <Badge tone="gray">{league.type}</Badge>
        </div>
        {league.description && (
          <p className="text-tertiary-glass text-sm m-0">{league.description}</p>
        )}
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5 mb-7">
        <KpiCard icon="👥" label={t('members')} value={memberCount} />
        <KpiCard icon="🎾" label="Partite" value={0} />
      </div>

      <LeagueDashboardClient
        league={league}
        topMembers={topMembers}
        locale={locale}
        inviteTitleLabel={t('inviteTitle')}
        inviteCodeLabel={t('inviteCode')}
        copyLabel={t('copyCode')}
        copiedLabel={t('copied')}
        membersLabel={t('membersTitle')}
      />
    </div>
  );
}

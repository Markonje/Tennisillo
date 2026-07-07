import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';
import { AvailabilityClient, type AvailabilityData } from './AvailabilityClient';

interface Props {
  params: { leagueId: string };
}

interface MeDto {
  id: string;
}

export default async function AvailabilityPage({ params }: Props) {
  const { leagueId } = params;
  const locale = await getLocale();
  const t = await getTranslations('availability');

  const [me, league] = await Promise.all([
    apiServer.get<MeDto>('/users/me'),
    apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`),
  ]);

  const myMember = (league?.members ?? []).find((m) => m.user.id === me?.id);
  if (!myMember) {
    redirect(`/${locale}/leagues/${leagueId}`);
  }

  const availability = await apiServer.get<AvailabilityData>(
    `/members/${myMember.id}/availability`,
  );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-2">{t('title')}</h1>
      <p className="text-sm text-tertiary-glass mt-0 mb-6">{t('patternHint')}</p>
      <AvailabilityClient
        leagueId={leagueId}
        locale={locale}
        initial={availability ?? { memberId: myMember.id, slots: [], overrides: [] }}
      />
    </div>
  );
}

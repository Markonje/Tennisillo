import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import { SeasonProvider } from '@/lib/season-context';
import type { SeasonContextValue } from '@/lib/season-context';

interface Props {
  children: ReactNode;
  params: { leagueId: string; seasonId: string };
}

export default async function SeasonLayout({ children, params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();

  const season = await apiServer.get<SeasonContextValue>(`/seasons/${seasonId}`);

  if (!season || season.leagueId !== leagueId) {
    redirect(`/${locale}/leagues/${leagueId}/seasons`);
  }

  return <SeasonProvider season={season}>{children}</SeasonProvider>;
}

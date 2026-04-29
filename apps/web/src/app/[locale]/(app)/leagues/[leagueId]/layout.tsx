import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getLocale } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import { LeagueProvider } from '@/lib/league-context';
import type { LeagueContextValue } from '@/lib/league-context';

interface Props {
  children: ReactNode;
  params: { leagueId: string };
}

export default async function LeagueLayout({ children, params }: Props) {
  const { leagueId } = params;
  const locale = await getLocale();

  const league = await apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`);

  if (!league) {
    redirect(`/${locale}/leagues`);
  }

  return <LeagueProvider league={league}>{children}</LeagueProvider>;
}

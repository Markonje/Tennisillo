import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { apiServer } from '@/lib/api-server';
import { createClient } from '@/lib/supabase/server';
import type { LeagueContextValue } from '@/lib/league-context';
import { LeagueSettingsClient } from './LeagueSettingsClient';

interface Props {
  params: { leagueId: string };
}

export default async function LeagueSettingsPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('league');
  const locale = await getLocale();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const league = await apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`);

  if (!league) {
    redirect(`/${locale}/leagues`);
  }

  const myMembership = league.members?.find((m) => m.user.id === user?.id);
  const isAdmin = myMembership?.role === 'ADMIN';

  if (!isAdmin) {
    redirect(`/${locale}/leagues/${leagueId}`);
  }

  const pendingMembers = (league.members ?? []).filter((m) => !m.isActive);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
        {t('settings')}
      </h1>

      <LeagueSettingsClient
        league={league}
        pendingMembers={pendingMembers}
        labels={{
          name: 'Nome lega',
          description: 'Descrizione',
          save: 'Salva modifiche',
          generateCode: 'Genera nuovo codice invito',
          pendingTitle: 'Richieste iscrizione',
          approve: 'Approva',
          noPending: 'Nessuna richiesta pendente',
        }}
      />
    </div>
  );
}

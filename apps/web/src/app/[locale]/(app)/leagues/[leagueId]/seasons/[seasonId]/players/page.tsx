import { getLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { GlassCard, Avatar, EmptyState } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { SeasonPlayerEntry } from '@tennisillo/shared-types';

interface Props {
  params: { leagueId: string; seasonId: string };
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export default async function SeasonPlayersPage({ params }: Props) {
  const { leagueId, seasonId } = params;
  const locale = await getLocale();
  const t = await getTranslations('season');

  const players = await apiServer.get<SeasonPlayerEntry[]>(`/seasons/${seasonId}/players`);

  if (!players) {
    redirect(`/${locale}/leagues/${leagueId}/seasons/${seasonId}`);
  }

  return (
    <div>
      <h1 className="text-[22px] font-extrabold text-primary-glass mb-5">{t('players')}</h1>

      {players.length === 0 ? (
        <EmptyState icon="👥" title="Nessun iscritto ancora." />
      ) : (
        <GlassCard className="py-2">
          {players.map((p, i) => (
            <div
              key={p.id}
              className={`flex items-center gap-3.5 px-[22px] py-3 ${
                i < players.length - 1 ? 'border-b border-glass' : ''
              }`}
            >
              <Avatar
                initials={p.displayName[0] ?? '?'}
                hue={nameToHue(p.displayName)}
                size={36}
              />
              <div className="flex-1">
                <div className="text-sm font-semibold text-primary-glass">{p.displayName}</div>
                <div className="text-xs text-tertiary-glass">@{p.username}</div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-muted-glass">{t('joinedAt')}</div>
                <div className="text-sm text-tertiary-glass">
                  {new Date(p.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

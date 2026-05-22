import { getTranslations } from 'next-intl/server';
import { GlassCard, Avatar, Badge, EmptyState } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';

interface Props {
  params: { leagueId: string };
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export default async function MembersPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('leagues');

  const league = await apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`);
  const members = league?.members ?? [];

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass mb-6">{t('members')}</h1>

      {members.length === 0 ? (
        <EmptyState icon="👥" title="Nessun membro." />
      ) : (
        <GlassCard className="py-2">
          {members.map((m, i) => (
            <div
              key={m.id}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i < members.length - 1 ? 'border-b border-glass' : ''
              }`}
            >
              <div className="flex items-center gap-3.5">
                <Avatar
                  initials={m.user.displayName.charAt(0)}
                  hue={nameToHue(m.user.displayName)}
                  size={40}
                />
                <div>
                  <p className="m-0 text-sm font-semibold text-primary-glass">
                    {m.user.displayName}
                  </p>
                  <p className="m-0 mt-0.5 text-xs text-tertiary-glass">{m.user.globalLevel}</p>
                </div>
              </div>
              <Badge tone={m.role === 'ADMIN' ? 'green' : 'gray'}>{m.role}</Badge>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

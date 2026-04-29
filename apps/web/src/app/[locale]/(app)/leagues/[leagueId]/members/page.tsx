import { getTranslations } from 'next-intl/server';
import { GlassCard } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { LeagueContextValue } from '@/lib/league-context';

interface Props {
  params: { leagueId: string };
}

export default async function MembersPage({ params }: Props) {
  const { leagueId } = params;
  const t = await getTranslations('leagues');

  const league = await apiServer.get<LeagueContextValue>(`/leagues/${leagueId}`);

  const members = league?.members ?? [];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
        {t('members')}
      </h1>

      {members.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nessun membro.</p>
      ) : (
        <GlassCard style={{ padding: '8px 0' }}>
          {members.map((m, i) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: i < members.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(176,239,96,0.1)',
                    border: '1px solid rgba(176,239,96,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#b0ef60',
                  }}
                >
                  {m.user.displayName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                    {m.user.displayName}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                    {m.user.globalLevel}
                  </p>
                </div>
              </div>
              <span
                style={{
                  background: m.role === 'ADMIN'
                    ? 'rgba(176,239,96,0.12)'
                    : 'rgba(255,255,255,0.05)',
                  color: m.role === 'ADMIN' ? '#b0ef60' : 'rgba(255,255,255,0.45)',
                  borderRadius: 6,
                  padding: '3px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {m.role}
              </span>
            </div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

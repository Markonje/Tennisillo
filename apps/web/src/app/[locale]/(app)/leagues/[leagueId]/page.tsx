import { getTranslations, getLocale } from 'next-intl/server';
import { GlassCard } from '@tennisillo/ui';
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
    return (
      <p style={{ color: 'rgba(255,255,255,0.4)' }}>Lega non trovata.</p>
    );
  }

  const memberCount = league.members?.length ?? 0;
  const topMembers = (league.members ?? []).slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            {league.name}
          </h1>
          <span
            style={{
              background: 'rgba(176,239,96,0.12)',
              color: '#b0ef60',
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {league.sport}
          </span>
          <span
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              borderRadius: 8,
              padding: '3px 10px',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {league.type}
          </span>
        </div>
        {league.description && (
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, margin: 0 }}>
            {league.description}
          </p>
        )}
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('members')}
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
            {memberCount}
          </p>
        </GlassCard>
        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('season')}
          </p>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.55)', margin: 0 }}>
            {t('noSeason')}
          </p>
        </GlassCard>
        <GlassCard style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Partite
          </p>
          <p style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>0</p>
        </GlassCard>
      </div>

      {/* Invite code (client component handles copy) + members preview */}
      <LeagueDashboardClient
        league={league}
        topMembers={topMembers}
        locale={locale}
        inviteCodeLabel={t('inviteCode')}
        copyLabel={t('copyCode')}
        membersLabel={t('membersTitle')}
        createSeasonLabel={t('createSeason')}
        comingSoonLabel={t('comingInSprint3')}
      />
    </div>
  );
}

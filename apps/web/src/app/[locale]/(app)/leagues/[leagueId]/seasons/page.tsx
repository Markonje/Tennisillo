import { redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { GlassCard } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';
import type { SeasonSummary, SeasonStatus } from '@tennisillo/shared-types';

interface Props {
  params: { leagueId: string };
}

function StatusBadge({ status }: { status: SeasonStatus; label: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' },
    REGISTRATION: { bg: 'rgba(100,180,255,0.12)', color: '#64b4ff' },
    ACTIVE: { bg: 'rgba(176,239,96,0.12)', color: '#b0ef60' },
    COMPLETED: { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' },
  };
  const c = colors[status] ?? { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' };
  return (
    <span
      style={{
        background: c.bg,
        color: c.color,
        borderRadius: 8,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

export default async function SeasonsPage({ params }: Props) {
  const { leagueId } = params;
  const locale = await getLocale();
  const t = await getTranslations('seasons');
  const tSeason = await getTranslations('season');

  const seasons = await apiServer.get<SeasonSummary[]>(`/leagues/${leagueId}/seasons`);

  if (!seasons) {
    redirect(`/${locale}/leagues`);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {t('title')}
        </h1>
        <Link
          href={`/${locale}/leagues/${leagueId}/seasons/new`}
          style={{
            background: '#b0ef60',
            color: '#0a0e1a',
            borderRadius: 10,
            padding: '9px 18px',
            fontSize: 14,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          {t('create')}
        </Link>
      </div>

      {seasons.length === 0 ? (
        <GlassCard style={{ padding: '32px 24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0 }}>{t('empty')}</p>
        </GlassCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {seasons.map((season) => (
            <Link
              key={season.id}
              href={`/${locale}/leagues/${leagueId}/seasons/${season.id}`}
              style={{ textDecoration: 'none' }}
            >
              <GlassCard
                style={{
                  padding: '18px 22px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.92)' }}>
                    {season.name}
                  </span>
                  <StatusBadge
                    status={season.status}
                    label={tSeason(`status.${season.status}`)}
                  />
                </div>
                <div style={{ display: 'flex', gap: 24, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                  <span>
                    {season.startsAt && season.endsAt
                      ? `${new Date(season.startsAt).toLocaleDateString()} – ${new Date(season.endsAt).toLocaleDateString()}`
                      : t('noDates')}
                  </span>
                  <span>
                    {tSeason('playersCount')}: {season.playerCount}
                    {season.maxPlayers ? `/${season.maxPlayers}` : ''}
                  </span>
                  {season.plannedDurationWeeks && (
                    <span>
                      {season.plannedDurationWeeks} {tSeason('weeks')}
                    </span>
                  )}
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

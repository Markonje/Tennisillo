import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getLocale, getTranslations } from 'next-intl/server';
import { Badge, GlassCard, KpiCard } from '@tennisillo/ui';
import { apiServer } from '@/lib/api-server';

interface Props {
  params: { leagueId: string };
}

interface PairAlert {
  players: string[];
  count: number;
  limit?: number;
}

interface AdminOverview {
  league: { id: string; name: string; memberCount: number };
  season: { id: string; name: string; status: string; playerCount: number } | null;
  matchStats: {
    validated: number;
    open: number;
    awaitingValidation: number;
    matchesPerWeek: number;
  } | null;
  disputes: { matchId: string; seasonId: string; players: string[]; openedAt: string }[];
  pendingProposals: number;
  mastersCount: number;
  alerts: {
    pairsAtLimit: PairAlert[];
    alternatingPairs: PairAlert[];
    sparringFarmingPairs: PairAlert[];
    sparringOnlyPlayers: string[];
    inactivePlayers: string[];
    lowReputation: { displayName: string; reputationScore: number }[];
  } | null;
  recentAudit: { action: string; entityType: string; actor: string; at: string }[];
}

export default async function AdminDashboardPage({ params }: Props) {
  const { leagueId } = params;
  const locale = await getLocale();
  const t = await getTranslations('adminDash');

  const overview = await apiServer.get<AdminOverview>(`/leagues/${leagueId}/admin/overview`);
  if (!overview) {
    // non-admins get a 403 from the API → apiServer returns null
    redirect(`/${locale}/leagues/${leagueId}`);
  }

  const alerts = overview.alerts;
  const hasAlerts =
    alerts &&
    (alerts.pairsAtLimit.length > 0 ||
      alerts.alternatingPairs.length > 0 ||
      alerts.sparringFarmingPairs.length > 0 ||
      alerts.sparringOnlyPlayers.length > 0 ||
      alerts.inactivePlayers.length > 0 ||
      alerts.lowReputation.length > 0);

  const pairList = (items: PairAlert[], labelKey: string) =>
    items.length > 0 && (
      <div>
        <h3 className="text-xs font-bold text-warning-light m-0 mb-1">{t(labelKey)}</h3>
        {items.map((p, i) => (
          <p key={i} className="text-sm text-secondary-glass m-0">
            {p.players.join(' + ')} — {p.count} {t('matchesLabel')}
            {p.limit ? ` / ${p.limit}` : ''}
          </p>
        ))}
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-primary-glass m-0 mb-2">{t('title')}</h1>
      <p className="text-sm text-tertiary-glass mt-0 mb-6">{t('hint')}</p>

      {/* Season overview */}
      {overview.season && overview.matchStats ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3.5 mb-6">
          <KpiCard icon="👥" label={t('players')} value={overview.season.playerCount} />
          <KpiCard icon="✅" label={t('validated')} value={overview.matchStats.validated} />
          <KpiCard icon="🎾" label={t('openMatches')} value={overview.matchStats.open} />
          <KpiCard
            icon="⏳"
            label={t('awaitingValidation')}
            value={overview.matchStats.awaitingValidation}
          />
          <KpiCard icon="📈" label={t('matchesPerWeek')} value={overview.matchStats.matchesPerWeek} />
          <KpiCard icon="🎓" label={t('masters')} value={overview.mastersCount} />
        </div>
      ) : (
        <GlassCard className="px-5 py-5 mb-6">
          <p className="text-sm text-tertiary-glass m-0">{t('noSeason')}</p>
        </GlassCard>
      )}

      {/* Open disputes */}
      <GlassCard className="px-5 py-5 mb-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3">
          {t('disputesTitle')} ({overview.disputes.length})
        </h2>
        {overview.disputes.length === 0 ? (
          <p className="text-sm text-tertiary-glass m-0">{t('noDisputes')}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {overview.disputes.map((d) => (
              <div key={d.matchId} className="flex flex-wrap items-center gap-3">
                <Badge tone="red" dot>
                  {new Date(d.openedAt).toLocaleDateString(locale)}
                </Badge>
                <span className="text-sm text-secondary-glass flex-1">
                  {d.players.join(' vs ')}
                </span>
                <Link
                  href={`/${locale}/leagues/${leagueId}/seasons/${d.seasonId}/matches/${d.matchId}`}
                  className="text-xs text-accent-light no-underline hover:underline"
                >
                  {t('review')} →
                </Link>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Venue proposals shortcut */}
      {overview.pendingProposals > 0 && (
        <GlassCard className="px-5 py-4 mb-5">
          <Link
            href={`/${locale}/leagues/${leagueId}/venues`}
            className="text-sm text-accent-light no-underline hover:underline"
          >
            📍 {t('proposals')}: {overview.pendingProposals} →
          </Link>
        </GlassCard>
      )}

      {/* Anti-fraud alerts */}
      <GlassCard className="px-5 py-5 mb-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3">{t('alertsTitle')}</h2>
        {!hasAlerts ? (
          <p className="text-sm text-tertiary-glass m-0">{t('noAlerts')}</p>
        ) : (
          <div className="flex flex-col gap-4">
            {alerts && pairList(alerts.pairsAtLimit, 'pairsAtLimit')}
            {alerts && pairList(alerts.alternatingPairs, 'alternatingPairs')}
            {alerts && pairList(alerts.sparringFarmingPairs, 'sparringFarmingPairs')}
            {alerts && alerts.sparringOnlyPlayers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-warning-light m-0 mb-1">
                  {t('sparringOnlyPlayers')}
                </h3>
                <p className="text-sm text-secondary-glass m-0">
                  {alerts.sparringOnlyPlayers.join(', ')}
                </p>
              </div>
            )}
            {alerts && alerts.inactivePlayers.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-warning-light m-0 mb-1">
                  {t('inactivePlayers')}
                </h3>
                <p className="text-sm text-secondary-glass m-0">
                  {alerts.inactivePlayers.join(', ')}
                </p>
              </div>
            )}
            {alerts && alerts.lowReputation.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-danger-light m-0 mb-1">
                  {t('lowReputation')}
                </h3>
                {alerts.lowReputation.map((p, i) => (
                  <p key={i} className="text-sm text-secondary-glass m-0">
                    {p.displayName} — {p.reputationScore}/100
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </GlassCard>

      {/* Recent audit */}
      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-3">{t('auditTitle')}</h2>
        {overview.recentAudit.length === 0 ? (
          <p className="text-sm text-tertiary-glass m-0">{t('noAudit')}</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {overview.recentAudit.map((a, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-muted-glass">
                  {new Date(a.at).toLocaleString(locale, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="font-semibold text-secondary-glass">{a.action}</span>
                <span className="text-tertiary-glass">· {a.actor}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

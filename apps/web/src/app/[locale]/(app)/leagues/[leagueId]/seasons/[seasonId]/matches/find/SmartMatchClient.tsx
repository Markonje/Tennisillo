'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar, Badge, Banner, Button, EmptyState, GlassCard, Toggle } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

export interface SmartMatchCandidate {
  memberId: string;
  playerId: string | null;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  finalScore: number;
  breakdown: {
    level: number;
    diversity: number;
    availability: number;
    frequency: number;
    geo: number;
  };
  suggestedSlots: { startsAt: string; endsAt: string }[];
  frequencyStatus: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
  warnings: string[];
}

interface Props {
  leagueId: string;
  seasonId: string;
  locale: string;
  initialCandidates: SmartMatchCandidate[];
}

const STATUS_TONE = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  UNKNOWN: 'gray',
} as const;

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export function SmartMatchClient({ leagueId, seasonId, locale, initialCandidates }: Props) {
  const t = useTranslations('smartMatch');

  const [candidates, setCandidates] = useState(initialCandidates);
  const [requireAvailability, setRequireAvailability] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refetch(require: boolean) {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.get<SmartMatchCandidate[]>(
        `/seasons/${seasonId}/matchmaking/candidates?limit=10&requireAvailability=${require}`,
      );
      setCandidates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const breakdownKeys = ['level', 'diversity', 'availability', 'frequency', 'geo'] as const;

  return (
    <div className="flex flex-col gap-4">
      {error && <Banner tone="danger">{error}</Banner>}

      <div className="flex items-center gap-2.5">
        <Toggle
          checked={requireAvailability}
          onChange={(v: boolean) => {
            setRequireAvailability(v);
            void refetch(v);
          }}
        />
        <span className="text-sm text-secondary-glass">{t('requireAvailability')}</span>
      </div>

      {candidates.length === 0 ? (
        <GlassCard className="px-5 py-5">
          <EmptyState icon="🔍" title={t('empty')} />
        </GlassCard>
      ) : (
        candidates.map((c) => (
          <GlassCard key={c.memberId} className={`px-5 py-4 ${loading ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center gap-3">
              <Avatar
                initials={c.displayName[0] ?? '?'}
                hue={nameToHue(c.displayName)}
                size={40}
              />
              <div className="min-w-[140px]">
                <div className="text-sm font-bold text-primary-glass">{c.displayName}</div>
                <div className="text-xs text-tertiary-glass">@{c.username}</div>
              </div>
              <Badge tone={STATUS_TONE[c.frequencyStatus]} dot>
                {t(`status.${c.frequencyStatus}`)}
              </Badge>
              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-muted-glass">
                    {t('score')}
                  </div>
                  <div className="text-xl font-extrabold text-accent-light">{c.finalScore}</div>
                </div>
                {c.playerId && (
                  <Link
                    href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/new?opponent=${c.playerId}${
                      c.suggestedSlots[0] ? `&slot=${encodeURIComponent(c.suggestedSlots[0].startsAt)}` : ''
                    }`}
                  >
                    <Button>{t('challenge')}</Button>
                  </Link>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 pt-3 border-t border-glass">
              {breakdownKeys.map((key) => (
                <span key={key} className="text-[11px] text-tertiary-glass">
                  {t(`breakdown.${key}`)}:{' '}
                  <strong className="text-secondary-glass">{Math.round(c.breakdown[key])}</strong>
                </span>
              ))}
            </div>

            <div className="mt-2 text-xs text-tertiary-glass">
              {c.suggestedSlots.length > 0 ? (
                <>
                  {t('suggestedSlots')}:{' '}
                  {c.suggestedSlots.map((s, i) => (
                    <span key={i} className="text-secondary-glass">
                      {i > 0 && ' · '}
                      {new Date(s.startsAt).toLocaleString(locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  ))}
                </>
              ) : (
                t('noSlots')
              )}
            </div>
          </GlassCard>
        ))
      )}
    </div>
  );
}

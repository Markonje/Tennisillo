'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Avatar, Badge, EmptyState, GlassCard, SegmentedControl } from '@tennisillo/ui';
import type { MatchDto, MatchStatusValue } from '@/lib/match-types';
import { formatSets } from '@/lib/match-types';

interface Props {
  matches: MatchDto[];
  locale: string;
  leagueId: string;
  seasonId: string;
  canChallenge: boolean;
}

type FilterKey = 'all' | 'open' | 'toValidate' | 'completed';

const FILTER_STATUSES: Record<Exclude<FilterKey, 'all'>, MatchStatusValue[]> = {
  open: ['PENDING_ACCEPTANCE', 'SCHEDULED', 'PENDING_RESULT'],
  toValidate: ['PENDING_VALIDATION', 'DISPUTED'],
  completed: ['VALIDATED', 'CANCELLED', 'WALKOVER'],
};

export function statusTone(status: MatchStatusValue): 'green' | 'yellow' | 'red' | 'blue' | 'gray' {
  switch (status) {
    case 'VALIDATED':
      return 'green';
    case 'PENDING_VALIDATION':
      return 'yellow';
    case 'DISPUTED':
      return 'red';
    case 'SCHEDULED':
    case 'PENDING_RESULT':
      return 'blue';
    default:
      return 'gray';
  }
}

function nameToHue(name: string): number {
  return Array.from(name).reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
}

export function MatchesListClient({ matches, locale, leagueId, seasonId, canChallenge }: Props) {
  const t = useTranslations('matches');
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return matches;
    const allowed = FILTER_STATUSES[filter];
    return matches.filter((m) => allowed.includes(m.status));
  }, [matches, filter]);

  const filterOptions = [
    { label: t('filters.all'), value: 'all' },
    { label: t('filters.open'), value: 'open' },
    { label: t('filters.toValidate'), value: 'toValidate' },
    { label: t('filters.completed'), value: 'completed' },
  ];

  if (matches.length === 0) {
    return (
      <GlassCard className="px-5 py-5">
        <EmptyState
          icon="🎾"
          title={t('empty')}
          description={canChallenge ? t('emptyCta') : undefined}
        />
      </GlassCard>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <SegmentedControl
          options={filterOptions}
          value={filter}
          onChange={(v: string) => setFilter(v as FilterKey)}
        />
      </div>

      <GlassCard className="px-5 py-2">
        {filtered.length === 0 ? (
          <EmptyState icon="🔍" title={t('empty')} />
        ) : (
          filtered.map((m, i) => (
            <Link
              key={m.id}
              href={`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/${m.id}`}
              className={`flex items-center gap-3 py-3 no-underline hover:bg-white/[0.04] -mx-2 px-2 rounded-[10px] transition-colors ${
                i < filtered.length - 1 ? 'border-b border-glass' : ''
              }`}
            >
              <div className="min-w-[70px] text-xs text-tertiary-glass">
                {m.scheduledAt
                  ? new Date(m.scheduledAt).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '—'}
              </div>
              <Avatar
                initials={m.player1.displayName[0] ?? '?'}
                hue={nameToHue(m.player1.displayName)}
                size={28}
              />
              <span className="text-[11px] text-muted-glass font-bold">{t('vs')}</span>
              <Avatar
                initials={m.player2.displayName[0] ?? '?'}
                hue={nameToHue(m.player2.displayName)}
                size={28}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-secondary-glass truncate">
                  {m.player1.displayName} {t('vs')} {m.player2.displayName}
                </div>
                {m.result && (
                  <div className="text-xs font-bold text-primary-glass">
                    {formatSets(m.result.sets)}
                  </div>
                )}
              </div>
              <Badge tone={statusTone(m.status)} dot>
                {t(`status.${m.status}`)}
              </Badge>
            </Link>
          ))
        )}
      </GlassCard>
    </div>
  );
}

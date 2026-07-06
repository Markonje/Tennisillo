'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Banner,
  Button,
  EmptyState,
  GlassCard,
  GlassInput,
  GlassSelect,
  Textarea,
} from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';
import type { SeasonPlayerEntry } from '@tennisillo/shared-types';
import type { MatchDto, MatchFormatValue } from '@/lib/match-types';

interface Props {
  players: SeasonPlayerEntry[];
  meUsername: string;
  locale: string;
  leagueId: string;
  seasonId: string;
}

const FORMATS: MatchFormatValue[] = ['BEST_OF_3', 'BEST_OF_1', 'SUPER_TIEBREAK', 'CUSTOM'];

export function NewChallengeClient({ players, meUsername, locale, leagueId, seasonId }: Props) {
  const router = useRouter();
  const t = useTranslations('challenges');
  const tMatches = useTranslations('matches');

  const opponents = players.filter((p) => p.username !== meUsername && p.isEligible);

  const [opponentId, setOpponentId] = useState('');
  const [format, setFormat] = useState<string>('BEST_OF_3');
  const [scheduledAt, setScheduledAt] = useState('');
  const [venue, setVenue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!opponentId) return;
    setLoading(true);
    setError(null);
    try {
      const match = await apiClient.post<MatchDto>(`/seasons/${seasonId}/challenges`, {
        opponentPlayerId: opponentId,
        format,
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt).toISOString() }),
        ...(venue && { venueTextFallback: venue }),
        ...(message && { message }),
      });
      router.push(`/${locale}/leagues/${leagueId}/seasons/${seasonId}/matches/${match.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      setLoading(false);
    }
  }

  if (opponents.length === 0) {
    return (
      <GlassCard className="px-5 py-5">
        <EmptyState icon="🎾" title={t('noOpponents')} />
      </GlassCard>
    );
  }

  return (
    <GlassCard className="px-5 py-5 max-w-lg">
      {error && (
        <Banner tone="danger" className="mb-4">
          {error}
        </Banner>
      )}

      <div className="flex flex-col gap-4">
        <GlassSelect
          label={t('opponent')}
          value={opponentId}
          onChange={setOpponentId}
          options={[
            { label: t('selectOpponent'), value: '' },
            ...opponents.map((p) => ({
              label: `${p.displayName} (@${p.username})`,
              value: p.id,
            })),
          ]}
        />

        <GlassSelect
          label={t('format')}
          value={format}
          onChange={setFormat}
          options={FORMATS.map((f) => ({ label: tMatches(`formats.${f}`), value: f }))}
        />

        <GlassInput
          label={t('proposedDate')}
          type="datetime-local"
          value={scheduledAt}
          onChange={setScheduledAt}
        />

        <GlassInput label={t('venue')} value={venue} onChange={setVenue} />

        <Textarea label={t('message')} value={message} onChange={setMessage} rows={3} />

        <div>
          <Button
            onClick={() => {
              void submit();
            }}
            disabled={loading || !opponentId}
            loading={loading}
          >
            {t('send')}
          </Button>
        </div>
      </div>
    </GlassCard>
  );
}

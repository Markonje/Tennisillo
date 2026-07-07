'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Badge, Banner, Button, GlassCard, GlassInput, GlassSelect } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

export interface FrequencyDetail {
  memberId: string;
  declared: boolean;
  idealFrequency: number | null;
  maxFrequency: number | null;
  unit: 'WEEKLY' | 'MONTHLY';
  currentPeriodMatches: number;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';
}

interface Props {
  leagueId: string;
  initial: FrequencyDetail | null;
}

const STATUS_TONE = {
  GREEN: 'green',
  YELLOW: 'yellow',
  RED: 'red',
  UNKNOWN: 'gray',
} as const;

export function FrequencyClient({ leagueId, initial }: Props) {
  const router = useRouter();
  const t = useTranslations('frequency');

  const [ideal, setIdeal] = useState(String(initial?.idealFrequency ?? 2));
  const [max, setMax] = useState(String(initial?.maxFrequency ?? 3));
  const [unit, setUnit] = useState<string>(initial?.unit ?? 'WEEKLY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const status = initial?.status ?? 'UNKNOWN';

  async function save() {
    setLoading(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient.put(`/leagues/${leagueId}/members/me/frequency`, {
        idealFrequency: Number(ideal),
        maxFrequency: Number(max),
        unit,
      });
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      {error && <Banner tone="danger">{error}</Banner>}
      {saved && <Banner tone="success">{t('saved')}</Banner>}

      <GlassCard className="px-5 py-5">
        <div className="flex items-center gap-3 mb-4">
          <Badge tone={STATUS_TONE[status]} dot>
            {t(`status.${status}`)}
          </Badge>
          {initial?.declared ? (
            <span className="text-sm text-secondary-glass">
              {t('current')}: <strong>{initial.currentPeriodMatches}</strong>
              {initial.maxFrequency !== null && ` / ${initial.maxFrequency}`}
            </span>
          ) : (
            <span className="text-sm text-tertiary-glass">{t('notDeclared')}</span>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <GlassInput
            label={t('ideal')}
            type="number"
            min={1}
            max={14}
            value={ideal}
            onChange={setIdeal}
            className="w-48"
          />
          <GlassInput
            label={t('max')}
            type="number"
            min={1}
            max={21}
            value={max}
            onChange={setMax}
            className="w-48"
          />
          <GlassSelect
            label={t('unit')}
            value={unit}
            onChange={setUnit}
            options={[
              { label: t('unitWEEKLY'), value: 'WEEKLY' },
              { label: t('unitMONTHLY'), value: 'MONTHLY' },
            ]}
            className="w-48"
          />
          <div>
            <Button
              onClick={() => {
                void save();
              }}
              disabled={loading || !ideal || !max || Number(max) < Number(ideal)}
              loading={loading}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

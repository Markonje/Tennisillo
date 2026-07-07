'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Banner, Button, GlassCard, GlassInput, GlassSelect, cn } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface PatternSlot {
  dayOfWeek: number;
  startMinute: number;
  endMinute: number;
}

interface Override {
  id: string;
  type: 'AVAILABLE' | 'UNAVAILABLE';
  startsAt: string;
  endsAt: string;
  note: string | null;
}

export interface AvailabilityData {
  memberId: string;
  slots: PatternSlot[];
  overrides: Override[];
}

interface Props {
  leagueId: string;
  locale: string;
  initial: AvailabilityData;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 - 22:00
const DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon-Sun display order

function slotsToCells(slots: PatternSlot[]): Set<string> {
  const cells = new Set<string>();
  for (const slot of slots) {
    const firstHour = Math.floor(slot.startMinute / 60);
    const lastHour = Math.ceil(slot.endMinute / 60);
    for (let h = firstHour; h < lastHour; h++) {
      cells.add(`${slot.dayOfWeek}:${h}`);
    }
  }
  return cells;
}

function cellsToSlots(cells: Set<string>): PatternSlot[] {
  const byDay = new Map<number, number[]>();
  for (const cell of cells) {
    const [dow, hour] = cell.split(':').map(Number);
    if (dow === undefined || hour === undefined) continue;
    const list = byDay.get(dow) ?? [];
    list.push(hour);
    byDay.set(dow, list);
  }

  const slots: PatternSlot[] = [];
  for (const [dow, hours] of byDay) {
    hours.sort((a, b) => a - b);
    let start = hours[0] as number;
    let prev = start;
    for (const hour of hours.slice(1)) {
      if (hour === prev + 1) {
        prev = hour;
        continue;
      }
      slots.push({ dayOfWeek: dow, startMinute: start * 60, endMinute: (prev + 1) * 60 });
      start = hour;
      prev = hour;
    }
    slots.push({ dayOfWeek: dow, startMinute: start * 60, endMinute: (prev + 1) * 60 });
  }
  return slots;
}

export function AvailabilityClient({ leagueId, locale, initial }: Props) {
  const router = useRouter();
  const t = useTranslations('availability');

  const [cells, setCells] = useState<Set<string>>(() => slotsToCells(initial.slots));
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [ovType, setOvType] = useState<'AVAILABLE' | 'UNAVAILABLE'>('UNAVAILABLE');
  const [ovFrom, setOvFrom] = useState('');
  const [ovTo, setOvTo] = useState('');
  const [ovNote, setOvNote] = useState('');

  function toggleCell(dow: number, hour: number) {
    const key = `${dow}:${hour}`;
    setCells((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  async function savePattern() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.put(`/leagues/${leagueId}/members/me/availability/pattern`, {
        slots: cellsToSlots(cells),
      });
      setDirty(false);
      setSaved(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function addOverride() {
    if (!ovFrom || !ovTo) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/leagues/${leagueId}/members/me/availability/overrides`, {
        type: ovType,
        startsAt: new Date(ovFrom).toISOString(),
        endsAt: new Date(ovTo).toISOString(),
        ...(ovNote && { note: ovNote }),
      });
      setOvFrom('');
      setOvTo('');
      setOvNote('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function deleteOverride(id: string) {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/availability/overrides/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error && <Banner tone="danger">{error}</Banner>}
      {saved && !dirty && <Banner tone="success">{t('saved')}</Banner>}

      {/* Weekly grid */}
      <GlassCard className="px-5 py-5 overflow-x-auto">
        <table className="border-separate border-spacing-0.5 select-none">
          <thead>
            <tr>
              <th className="w-12" aria-hidden="true" />
              {DAYS.map((d) => (
                <th
                  key={d}
                  className="text-[11px] font-semibold text-tertiary-glass px-1 pb-1 min-w-[42px]"
                >
                  {t(`days.${d}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((hour) => (
              <tr key={hour}>
                <td className="text-[10px] text-muted-glass pr-2 text-right align-middle">
                  {String(hour).padStart(2, '0')}:00
                </td>
                {DAYS.map((dow) => {
                  const active = cells.has(`${dow}:${hour}`);
                  return (
                    <td key={dow} className="p-0">
                      <button
                        type="button"
                        aria-pressed={active}
                        aria-label={`${t(`days.${dow}`)} ${hour}:00`}
                        onClick={() => toggleCell(dow, hour)}
                        className={cn(
                          'w-full h-6 min-w-[42px] rounded-[5px] border transition-colors duration-100',
                          active
                            ? 'bg-accent/40 border-accent/60'
                            : 'bg-glass-subtle border-glass hover:bg-white/[0.08]',
                        )}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4">
          <Button
            onClick={() => {
              void savePattern();
            }}
            disabled={loading || !dirty}
            loading={loading}
          >
            {t('save')}
          </Button>
        </div>
      </GlassCard>

      {/* Overrides */}
      <GlassCard className="px-5 py-5">
        <h2 className="text-sm font-bold text-secondary-glass m-0 mb-1">{t('overridesTitle')}</h2>
        <p className="text-xs text-tertiary-glass mt-0 mb-4">{t('overridesHint')}</p>

        <div className="flex flex-wrap items-end gap-3 mb-4">
          <GlassSelect
            label={t('overrideType')}
            value={ovType}
            onChange={(v) => setOvType(v as 'AVAILABLE' | 'UNAVAILABLE')}
            options={[
              { label: t('typeUNAVAILABLE'), value: 'UNAVAILABLE' },
              { label: t('typeAVAILABLE'), value: 'AVAILABLE' },
            ]}
            className="w-44"
          />
          <GlassInput
            label={t('from')}
            type="datetime-local"
            value={ovFrom}
            onChange={setOvFrom}
          />
          <GlassInput label={t('to')} type="datetime-local" value={ovTo} onChange={setOvTo} />
          <GlassInput label={t('note')} value={ovNote} onChange={setOvNote} className="w-44" />
          <Button
            variant="secondary"
            onClick={() => {
              void addOverride();
            }}
            disabled={loading || !ovFrom || !ovTo}
          >
            {t('addOverride')}
          </Button>
        </div>

        {initial.overrides.length === 0 ? (
          <p className="text-sm text-tertiary-glass m-0">{t('noOverrides')}</p>
        ) : (
          <div className="flex flex-col">
            {initial.overrides.map((o, i) => (
              <div
                key={o.id}
                className={cn(
                  'flex flex-wrap items-center gap-3 py-2.5',
                  i < initial.overrides.length - 1 && 'border-b border-glass',
                )}
              >
                <span
                  className={cn(
                    'text-[11px] font-bold px-2 py-0.5 rounded-badge border',
                    o.type === 'AVAILABLE'
                      ? 'text-accent-light bg-success/10 border-success/30'
                      : 'text-danger-light bg-danger/10 border-danger/30',
                  )}
                >
                  {t(`type${o.type}`)}
                </span>
                <span className="text-sm text-secondary-glass">
                  {new Date(o.startsAt).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}{' '}
                  →{' '}
                  {new Date(o.endsAt).toLocaleString(locale, {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                {o.note && <span className="text-xs text-tertiary-glass">{o.note}</span>}
                <button
                  type="button"
                  onClick={() => {
                    void deleteOverride(o.id);
                  }}
                  className="ml-auto text-xs text-danger-light hover:underline bg-transparent border-0 cursor-pointer"
                >
                  {t('delete')}
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

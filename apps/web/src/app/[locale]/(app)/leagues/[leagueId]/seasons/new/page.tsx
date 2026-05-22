'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard, GlassInput, Button, Banner } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';
import { computeOptimalDuration } from '@tennisillo/shared-types';

interface CreateSeasonPayload {
  id: string;
}

export default function NewSeasonPage() {
  const router = useRouter();
  const params = useParams<{ locale: string; leagueId: string }>();
  const { locale, leagueId } = params;

  const [name, setName] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('');
  const [plannedDurationWeeks, setPlannedDurationWeeks] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const suggestion = computeOptimalDuration({ playerCount: 0 });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const body: Record<string, unknown> = { name };
      if (startsAt) body['startsAt'] = startsAt;
      if (endsAt) body['endsAt'] = endsAt;
      if (maxPlayers) body['maxPlayers'] = parseInt(maxPlayers, 10);
      if (plannedDurationWeeks) body['plannedDurationWeeks'] = parseInt(plannedDurationWeeks, 10);

      const season = await apiClient.post<CreateSeasonPayload>(
        `/leagues/${leagueId}/seasons`,
        body,
      );
      router.push(`/${locale}/leagues/${leagueId}/seasons/${season.id}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore sconosciuto';
      if (msg.includes('409') || msg.includes('Conflict')) {
        setError('La lega ha già una stagione attiva. Chiudila prima di crearne una nuova.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-extrabold text-primary-glass mb-6">Nuova stagione</h1>

      <GlassCard className="p-7">
        <form onSubmit={(e) => { void handleSubmit(e); }} className="flex flex-col gap-4">
          <GlassInput
            label="Nome stagione *"
            value={name}
            onChange={setName}
            required
            maxLength={80}
            placeholder="Es. Stagione Primavera 2026"
          />

          <div className="grid grid-cols-2 gap-3.5">
            <GlassInput
              label="Data inizio"
              type="date"
              value={startsAt}
              onChange={setStartsAt}
            />
            <GlassInput
              label="Data fine"
              type="date"
              value={endsAt}
              onChange={setEndsAt}
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <GlassInput
              label="Massimo iscritti"
              type="number"
              value={maxPlayers}
              onChange={setMaxPlayers}
              min={2}
              max={200}
              placeholder="Illimitato"
            />
            <div>
              <GlassInput
                label="Durata pianificata (settimane)"
                type="number"
                value={plannedDurationWeeks}
                onChange={setPlannedDurationWeeks}
                min={6}
                max={52}
                placeholder={`Suggerito: ${suggestion.weeks}`}
              />
              <p className="text-[11px] text-muted-glass mt-1">
                Formula suggerisce {suggestion.weeks} settimane
              </p>
            </div>
          </div>

          {error && <Banner tone="danger">{error}</Banner>}

          <Button type="submit" disabled={loading} loading={loading} className="w-full">
            {loading ? 'Creazione…' : 'Crea stagione'}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

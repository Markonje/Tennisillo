'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GlassCard } from '@tennisillo/ui';
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

  const playerCountForPreview = 0;
  const suggestion = computeOptimalDuration({ playerCount: playerCountForPreview });

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 10,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    padding: '10px 14px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', marginBottom: 24 }}>
        Nuova stagione
      </h1>

      <GlassCard style={{ padding: '28px 24px' }}>
        <form onSubmit={(e) => { void handleSubmit(e); }}>
          <div style={{ marginBottom: 18 }}>
            <label style={labelStyle}>Nome stagione *</label>
            <input
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              placeholder="Es. Stagione Primavera 2026"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
            <div>
              <label style={labelStyle}>Data inizio</label>
              <input
                type="date"
                style={inputStyle}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </div>
            <div>
              <label style={labelStyle}>Data fine</label>
              <input
                type="date"
                style={inputStyle}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            <div>
              <label style={labelStyle}>Massimo iscritti</label>
              <input
                type="number"
                style={inputStyle}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                min={2}
                max={200}
                placeholder="Illimitato"
              />
            </div>
            <div>
              <label style={labelStyle}>
                Durata pianificata (settimane)
              </label>
              <input
                type="number"
                style={inputStyle}
                value={plannedDurationWeeks}
                onChange={(e) => setPlannedDurationWeeks(e.target.value)}
                min={6}
                max={52}
                placeholder={`Suggerito: ${suggestion.weeks}`}
              />
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                Formula suggerisce {suggestion.weeks} settimane
              </p>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(240,100,100,0.12)',
                border: '1px solid rgba(240,100,100,0.2)',
                borderRadius: 8,
                padding: '10px 14px',
                color: '#f09090',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(176,239,96,0.4)' : '#b0ef60',
              color: '#0a0e1a',
              border: 'none',
              borderRadius: 10,
              padding: '12px',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Creazione…' : 'Crea stagione'}
          </button>
        </form>
      </GlassCard>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';
import type { SeasonContextValue } from '@/lib/season-context';

interface Props {
  season: SeasonContextValue;
  locale: string;
  playerCount: number;
}

export function SeasonDashboardClient({ season, locale: _locale, playerCount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  async function transition(to: 'REGISTRATION' | 'ACTIVE' | 'COMPLETED') {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/seasons/${season.id}/transition`, { to });
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setError(msg);
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  }

  async function register() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/seasons/${season.id}/registrations`, {});
      setIsRegistered(true);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function unregister() {
    setLoading(true);
    setError(null);
    try {
      await apiClient.delete(`/seasons/${season.id}/registrations/me`);
      setIsRegistered(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const btnBase: React.CSSProperties = {
    border: 'none',
    borderRadius: 10,
    padding: '10px 18px',
    fontSize: 14,
    fontWeight: 700,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  };

  return (
    <GlassCard style={{ padding: '20px 22px', marginBottom: 20 }}>
      {error && (
        <div
          style={{
            background: 'rgba(240,100,100,0.12)',
            border: '1px solid rgba(240,100,100,0.2)',
            borderRadius: 8,
            padding: '10px 14px',
            color: '#f09090',
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {/* Admin actions */}
        {season.status === 'DRAFT' && (
          <button
            style={{ ...btnBase, background: '#64b4ff', color: '#0a0e1a' }}
            onClick={() => { void transition('REGISTRATION'); }}
            disabled={loading}
          >
            Apri iscrizioni
          </button>
        )}

        {season.status === 'REGISTRATION' && (
          <>
            <button
              style={{
                ...btnBase,
                background: playerCount < 2 ? 'rgba(176,239,96,0.3)' : '#b0ef60',
                color: '#0a0e1a',
                cursor: playerCount < 2 || loading ? 'not-allowed' : 'pointer',
              }}
              onClick={() => { void transition('ACTIVE'); }}
              disabled={loading || playerCount < 2}
              title={playerCount < 2 ? 'Servono almeno 2 iscritti' : undefined}
            >
              Avvia stagione
            </button>
            {playerCount < 2 && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', alignSelf: 'center' }}>
                Servono almeno 2 iscritti
              </span>
            )}

            {/* Member register/unregister */}
            {!isRegistered ? (
              <button
                style={{ ...btnBase, background: 'rgba(176,239,96,0.12)', color: '#b0ef60', border: '1px solid rgba(176,239,96,0.2)' }}
                onClick={() => { void register(); }}
                disabled={loading}
              >
                Iscriviti
              </button>
            ) : (
              <button
                style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                onClick={() => { void unregister(); }}
                disabled={loading}
              >
                Annulla iscrizione
              </button>
            )}
          </>
        )}

        {season.status === 'ACTIVE' && (
          <>
            {!showConfirm ? (
              <button
                style={{ ...btnBase, background: 'rgba(240,144,144,0.12)', color: '#f09090', border: '1px solid rgba(240,144,144,0.2)' }}
                onClick={() => setShowConfirm(true)}
                disabled={loading}
              >
                Chiudi stagione
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                  Sei sicuro? Questa azione è irreversibile.
                </span>
                <button
                  style={{ ...btnBase, background: '#f09090', color: '#0a0e1a' }}
                  onClick={() => { void transition('COMPLETED'); }}
                  disabled={loading}
                >
                  Conferma
                </button>
                <button
                  style={{ ...btnBase, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Annulla
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}

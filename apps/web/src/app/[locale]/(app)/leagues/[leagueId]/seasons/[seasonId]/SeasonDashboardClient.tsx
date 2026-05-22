'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard, Button, Banner } from '@tennisillo/ui';
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

  return (
    <GlassCard className="px-5 py-5 mb-5">
      {error && <Banner tone="danger" className="mb-3.5">{error}</Banner>}

      <div className="flex flex-wrap gap-2.5">
        {season.status === 'DRAFT' && (
          <Button
            variant="secondary"
            className="border-[rgba(121,167,216,0.4)] text-blue-light hover:bg-blue-faint"
            onClick={() => { void transition('REGISTRATION'); }}
            disabled={loading}
            loading={loading}
          >
            Apri iscrizioni
          </Button>
        )}

        {season.status === 'REGISTRATION' && (
          <>
            <Button
              onClick={() => { void transition('ACTIVE'); }}
              disabled={loading || playerCount < 2}
              loading={loading}
              title={playerCount < 2 ? 'Servono almeno 2 iscritti' : undefined}
            >
              Avvia stagione
            </Button>
            {playerCount < 2 && (
              <span className="text-xs text-tertiary-glass self-center">
                Servono almeno 2 iscritti
              </span>
            )}

            {!isRegistered ? (
              <Button
                variant="ghost"
                className="border border-success/30 text-accent-light hover:bg-success/10"
                onClick={() => { void register(); }}
                disabled={loading}
              >
                Iscriviti
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={() => { void unregister(); }}
                disabled={loading}
              >
                Annulla iscrizione
              </Button>
            )}
          </>
        )}

        {season.status === 'ACTIVE' && (
          <>
            {!showConfirm ? (
              <Button
                variant="danger"
                onClick={() => setShowConfirm(true)}
                disabled={loading}
              >
                Chiudi stagione
              </Button>
            ) : (
              <div className="flex flex-wrap gap-2.5 items-center">
                <span className="text-sm text-tertiary-glass">
                  Sei sicuro? Questa azione è irreversibile.
                </span>
                <Button
                  variant="danger"
                  onClick={() => { void transition('COMPLETED'); }}
                  disabled={loading}
                  loading={loading}
                >
                  Conferma
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConfirm(false)}
                  disabled={loading}
                >
                  Annulla
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </GlassCard>
  );
}

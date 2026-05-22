'use client';

import { useState } from 'react';
import { GlassInput, Button, Banner } from '@tennisillo/ui';
import { apiClient } from '@/lib/api-client';

interface Props {
  locale: string;
  joinLabel: string;
  placeholder: string;
}

export function JoinByCodeForm({ locale, joinLabel, placeholder }: Props) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    if (!code.trim()) {
      setError('Inserisci un codice invito.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiClient.post<{ leagueId: string }>(`/leagues/join/${code.trim()}`, {});
      window.location.href = `/${locale}/leagues/${res.leagueId}`;
    } catch {
      setError('Codice non valido o lega non trovata.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex gap-2">
        <GlassInput
          placeholder={placeholder}
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { void handleJoin(); } }}
          className="flex-1 min-w-0"
        />
        <Button
          type="button"
          onClick={() => { void handleJoin(); }}
          loading={loading}
        >
          {joinLabel}
        </Button>
      </div>
      {error && <Banner tone="danger" className="mt-2">{error}</Banner>}
    </div>
  );
}

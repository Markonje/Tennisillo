'use client';

import { useState } from 'react';
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
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          placeholder={placeholder}
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') { void handleJoin(); } }}
          style={{
            flex: 1,
            background: error ? 'rgba(240,144,144,0.05)' : 'rgba(255,255,255,0.07)',
            border: error ? '1px solid #f09090' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: 10,
            padding: '10px 14px',
            color: 'rgba(255,255,255,0.9)',
            fontSize: 14,
            outline: 'none',
          }}
        />
        <button
          onClick={() => { void handleJoin(); }}
          disabled={loading}
          style={{
            background: '#b0ef60',
            color: '#0a0e1a',
            border: 'none',
            borderRadius: 10,
            padding: '10px 18px',
            fontWeight: 700,
            fontSize: 13,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.7 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '…' : joinLabel}
        </button>
      </div>
      {error && <p style={{ color: '#f09090', fontSize: 12, marginTop: 6, marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

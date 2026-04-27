'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { GlassCard } from '@tennisillo/ui';
import { apiClient } from '../../../../lib/api-client';

interface League {
  id: string;
  name: string;
  sport: string;
  type: string;
  _count?: { members: number };
}

export default function LeaguesPage() {
  const t = useTranslations('leagues');
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinCodeError, setJoinCodeError] = useState(false);
  const [newLeague, setNewLeague] = useState({ name: '', sport: 'TENNIS_SINGLES', type: 'PUBLIC' });

  useEffect(() => {
    void (async () => {
      try {
        const data = await apiClient.get<League[]>('/leagues/me');
        setLeagues(data);
      } catch {
        setError('Impossibile caricare le leghe.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function createLeague() {
    try {
      const league = await apiClient.post<League>('/leagues', newLeague);
      setLeagues((prev) => [league, ...prev]);
      setShowCreate(false);
      setNewLeague({ name: '', sport: 'TENNIS_SINGLES', type: 'PUBLIC' });
    } catch {
      setError('Impossibile creare la lega.');
    }
  }

  async function joinWithCode() {
    if (!joinCode.trim()) {
      setJoinCodeError(true);
      setError('Inserisci un codice invito valido.');
      return;
    }
    setJoinCodeError(false);
    setError(null);
    try {
      await apiClient.post(`/leagues/join/${joinCode}`, {});
      setJoinCode('');
      window.location.reload();
    } catch {
      setError('Codice non valido o lega non trovata.');
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: 0 }}>
          {t('title')}
        </h1>
        <button onClick={() => setShowCreate(!showCreate)} style={btnStyle}>
          {t('create')}
        </button>
      </div>

      {/* Join with code */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          placeholder={t('joinWithCode')}
          value={joinCode}
          onChange={(e) => { setJoinCode(e.target.value); setJoinCodeError(false); }}
          style={{
            ...inputStyle,
            border: joinCodeError
              ? '1px solid #f09090'
              : '1px solid rgba(255,255,255,0.12)',
          }}
        />
        <button onClick={() => { void joinWithCode(); }} style={btnStyle}>{t('join')}</button>
      </div>

      {/* Create league form */}
      {showCreate && (
        <GlassCard style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              placeholder="Nome lega"
              value={newLeague.name}
              onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
              style={inputStyle}
            />
            <select
              value={newLeague.sport}
              onChange={(e) => setNewLeague({ ...newLeague, sport: e.target.value })}
              style={inputStyle}
            >
              <option value="TENNIS_SINGLES">Tennis Singles</option>
              <option value="TENNIS_DOUBLES">Tennis Doubles</option>
              <option value="PADEL">Padel</option>
            </select>
            <select
              value={newLeague.type}
              onChange={(e) => setNewLeague({ ...newLeague, type: e.target.value })}
              style={inputStyle}
            >
              <option value="PUBLIC">Pubblica</option>
              <option value="PRIVATE">Privata</option>
            </select>
            <button onClick={() => { void createLeague(); }} style={btnStyle}>Crea</button>
          </div>
        </GlassCard>
      )}

      {/* League list area — error lives here */}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Caricamento…</p>
      ) : error ? (
        <p style={{ color: '#f09090', fontSize: 13 }}>{error}</p>
      ) : leagues.length === 0 ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Nessuna lega trovata.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {leagues.map((league) => (
            <GlassCard key={league.id} style={{ padding: 16 }} hover>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', margin: 0 }}>{league.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                    {league.sport} · {league.type} · {league._count?.members ?? 0} membri
                  </p>
                </div>
                <span style={{ color: '#b0ef60', fontSize: 20 }}>→</span>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: '#b0ef60',
  color: '#0a0e1a',
  border: 'none',
  borderRadius: 10,
  padding: '10px 18px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10,
  padding: '10px 14px',
  color: 'rgba(255,255,255,0.9)',
  fontSize: 14,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
};

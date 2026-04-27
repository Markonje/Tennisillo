'use client';

import type { Player } from '@tennisillo/shared-types';
import { GlassCard, RankingRow } from '@tennisillo/ui';

// TODO: replace with GET /leagues/:id/ranking once season ranking endpoint is available
const MOCK_PLAYERS: Player[] = [
  { id: '1', name: 'Marco Rossi', initials: 'MR', hue: '120', level: 5, points: 1850, ranking: 1, variation: 2, winRate: 72, matches: 18, wins: 13, losses: 5 },
  { id: '2', name: 'Luca Bianchi', initials: 'LB', hue: '200', level: 4, points: 1720, ranking: 2, variation: 0, winRate: 65, matches: 20, wins: 13, losses: 7 },
  { id: '3', name: 'Sara Verdi', initials: 'SV', hue: '340', level: 6, points: 1680, ranking: 3, variation: -1, winRate: 60, matches: 15, wins: 9, losses: 6 },
  { id: '4', name: 'Elena Neri', initials: 'EN', hue: '50', level: 3, points: 1540, ranking: 4, variation: 1, winRate: 55, matches: 22, wins: 12, losses: 10 },
  { id: '5', name: 'Giorgio Blu', initials: 'GB', hue: '260', level: 4, points: 1490, ranking: 5, variation: -2, winRate: 50, matches: 16, wins: 8, losses: 8 },
];

const HEADER_COLS = ['#', 'Giocatore', 'Punti', 'Var.', 'Win%', 'Partite'];

export default function RankingPage() {
  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: 'rgba(255,255,255,0.95)', margin: '0 0 24px' }}>
        Classifica
      </h1>

      <GlassCard style={{ padding: '8px 0' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '44px 1fr 90px 80px 80px 70px',
            padding: '6px 14px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            marginBottom: 4,
          }}
        >
          {HEADER_COLS.map((col) => (
            <div
              key={col}
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                textAlign: col === '#' || col === 'Giocatore' ? 'left' : 'right',
              }}
            >
              {col}
            </div>
          ))}
        </div>

        <div style={{ padding: '4px 0' }}>
          {MOCK_PLAYERS.map((player) => (
            <RankingRow key={player.id} player={player} />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

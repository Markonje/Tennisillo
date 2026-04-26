import React from 'react';
import type { Player } from '@tennisillo/shared-types';
import { Avatar } from './Avatar';

export interface RankingRowProps {
  player: Player;
  isCurrentPlayer?: boolean;
  onClick?: (player: Player) => void;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export function RankingRow({ player, isCurrentPlayer = false, onClick }: RankingRowProps) {
  const [hov, setHov] = React.useState(false);
  const isTop3 = player.ranking <= 3;

  return (
    <div
      onClick={() => onClick?.(player)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '44px 1fr 90px 80px 80px 70px',
        alignItems: 'center',
        padding: '10px 14px',
        borderRadius: 14,
        cursor: onClick ? 'pointer' : 'default',
        background: isCurrentPlayer
          ? 'rgba(185,255,90,0.10)'
          : hov ? 'rgba(255,255,255,0.06)' : 'transparent',
        border: isCurrentPlayer ? '1px solid rgba(185,255,90,0.3)' : '1px solid transparent',
        boxShadow: isCurrentPlayer ? '0 0 20px rgba(185,255,90,0.1)' : 'none',
        transition: 'all 0.15s ease',
        marginBottom: 2,
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: isTop3 ? undefined : 'rgba(255,255,255,0.7)' }}>
        {isTop3 ? MEDALS[player.ranking - 1] : player.ranking}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar initials={player.initials} hue={player.hue} size={30} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: isCurrentPlayer ? '#c8ff78' : 'rgba(255,255,255,0.9)' }}>
            {player.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Livello {player.level}</div>
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.9)', textAlign: 'right' }}>
        {player.points.toLocaleString()}
      </div>
      <div style={{ textAlign: 'right' }}>
        {player.variation === 0 ? (
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>—</span>
        ) : (
          <span style={{ color: player.variation > 0 ? '#b0ef60' : '#f09090', fontSize: 12, fontWeight: 700 }}>
            {player.variation > 0 ? `▲ ${player.variation}` : `▼ ${Math.abs(player.variation)}`}
          </span>
        )}
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'right' }}>{player.winRate}%</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', textAlign: 'right' }}>{player.matches}</div>
    </div>
  );
}

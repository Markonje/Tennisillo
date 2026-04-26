import React from 'react';
import type { Match, Player } from '@tennisillo/shared-types';
import { isUpcomingMatch } from '@tennisillo/shared-types';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';

export interface MatchRowProps {
  match: Match;
  currentPlayer: Player;
  opponent: Player;
  showVenue?: boolean;
}

const ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 4px',
  borderBottom: '1px solid rgba(255,255,255,0.07)',
};

export function MatchRow({ match, currentPlayer, opponent, showVenue }: MatchRowProps) {
  if (isUpcomingMatch(match)) {
    return (
      <div style={ROW_STYLE}>
        <div style={{ textAlign: 'center', minWidth: 38 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>{match.date}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{match.month}</div>
        </div>
        <Avatar initials={currentPlayer.initials} hue={currentPlayer.hue} size={32} />
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>vs</span>
        <Avatar initials={opponent.initials} hue={opponent.hue} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{opponent.name}</div>
          {showVenue && (
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{match.venue}</div>
          )}
        </div>
        <StatusBadge status={match.status} />
      </div>
    );
  }

  return (
    <div style={ROW_STYLE}>
      <div style={{ minWidth: 38, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{match.date}</div>
      <Avatar initials={currentPlayer.initials} hue={currentPlayer.hue} size={32} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>vs</span>
      <Avatar initials={opponent.initials} hue={opponent.hue} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{opponent.name}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{match.score}</div>
      </div>
      <StatusBadge status={match.result} />
    </div>
  );
}

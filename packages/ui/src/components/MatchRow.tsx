import React from 'react';
import { Avatar } from './Avatar';
import { StatusBadge } from './StatusBadge';
import type { BadgeStatus } from './StatusBadge';

export interface MatchData {
  date: string;
  month?: string;
  status?: BadgeStatus;
  venue?: string;
  score?: string;
  result?: 'win' | 'loss';
  opponentInitials: string;
  opponentHue: string;
  opponentName: string;
}

export interface MatchRowProps {
  match: MatchData;
  currentPlayerInitials: string;
  currentPlayerHue: string;
  showVenue?: boolean;
}

export function MatchRow({ match, currentPlayerInitials, currentPlayerHue, showVenue }: MatchRowProps) {
  const isUpcoming = match.status !== undefined;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '10px 4px',
      borderBottom: '1px solid rgba(255,255,255,0.07)',
    }}>
      {isUpcoming ? (
        <div style={{ textAlign: 'center', minWidth: 38 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.9)', lineHeight: 1 }}>{match.date}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600 }}>{match.month}</div>
        </div>
      ) : (
        <div style={{ minWidth: 38, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{match.date}</div>
      )}
      <Avatar initials={currentPlayerInitials} hue={currentPlayerHue} size={32} />
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>vs</span>
      <Avatar initials={match.opponentInitials} hue={match.opponentHue} size={32} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{match.opponentName}</div>
        {showVenue && match.venue && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{match.venue}</div>
        )}
        {!isUpcoming && match.score && (
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{match.score}</div>
        )}
      </div>
      {isUpcoming && match.status && <StatusBadge status={match.status} />}
      {!isUpcoming && match.result && <StatusBadge status={match.result} />}
    </div>
  );
}

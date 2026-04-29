'use client';

import React from 'react';
import type { Challenge, Player } from '@tennisillo/shared-types';
import { Avatar } from './Avatar';

export interface ChallengeCardProps {
  challenge: Challenge;
  challenger: Player;
  onAccept: () => void;
  onReject: () => void;
}

export function ChallengeCard({ challenge, challenger, onAccept, onReject }: ChallengeCardProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 14,
      marginBottom: 8,
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      <Avatar initials={challenger.initials} hue={challenger.hue} size={38} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{challenger.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Sfida per il {challenge.proposedDate}</div>
      </div>
      <button
        onClick={onReject}
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          border: '1px solid rgba(233,109,109,0.35)',
          background: 'rgba(233,109,109,0.12)',
          color: '#f09090',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >✕</button>
      <button
        onClick={onAccept}
        style={{
          width: 30,
          height: 30,
          borderRadius: 10,
          border: '1px solid rgba(185,255,90,0.4)',
          background: 'rgba(185,255,90,0.15)',
          color: '#c8ff78',
          cursor: 'pointer',
          fontSize: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >✓</button>
    </div>
  );
}

import React from 'react';

export type ActivityType =
  | 'match'
  | 'availability'
  | 'ranking'
  | 'message'
  | 'badge'
  | 'sparring'
  | 'challenge'
  | 'admin'
  | 'system';

export interface ActivityData {
  type: ActivityType;
  text: string;
  time: string;
}

export interface ActivityItemProps {
  item: ActivityData;
}

const ICONS: Record<ActivityType, string> = {
  match:        '🎾',
  availability: '📅',
  ranking:      '🏆',
  message:      '💬',
  badge:        '🏅',
  sparring:     '🎾',
  challenge:    '⚔️',
  admin:        '📢',
  system:       '📋',
};

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '9px 0',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: 'rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        flexShrink: 0,
      }}>
        {ICONS[item.type] ?? '•'}
      </div>
      <div style={{ flex: 1, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{item.text}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>{item.time}</div>
    </div>
  );
}

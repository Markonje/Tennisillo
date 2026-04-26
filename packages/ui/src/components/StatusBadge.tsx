import React from 'react';
import { cn } from '../lib/cn';

export type BadgeStatus =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'win'
  | 'loss'
  | 'training';

const MAP: Record<BadgeStatus, { label: string; bg: string; border: string; color: string }> = {
  confirmed: { label: 'Confermata',   bg: 'rgba(185,255,90,0.18)',  border: 'rgba(185,255,90,0.4)',   color: '#c8ff78' },
  pending:   { label: 'In attesa',    bg: 'rgba(242,211,94,0.18)',  border: 'rgba(242,211,94,0.4)',   color: '#f5d96a' },
  completed: { label: 'Completata',   bg: 'rgba(121,167,216,0.18)', border: 'rgba(121,167,216,0.4)',  color: '#9abfdd' },
  cancelled: { label: 'Annullata',    bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' },
  disputed:  { label: 'Contestata',   bg: 'rgba(233,109,109,0.18)', border: 'rgba(233,109,109,0.4)',  color: '#f09090' },
  win:       { label: 'Vittoria',     bg: 'rgba(185,255,90,0.18)',  border: 'rgba(185,255,90,0.4)',   color: '#c8ff78' },
  loss:      { label: 'Sconfitta',    bg: 'rgba(233,109,109,0.18)', border: 'rgba(233,109,109,0.4)',  color: '#f09090' },
  training:  { label: 'Allenamento',  bg: 'rgba(121,167,216,0.18)', border: 'rgba(121,167,216,0.4)', color: '#9abfdd' },
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = MAP[status] ?? MAP.pending;
  return (
    <span
      className={cn(className)}
      style={{
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        whiteSpace: 'nowrap',
      }}
    >
      {s.label}
    </span>
  );
}

import React from 'react';
import { cn } from '../lib/cn';
import { tokens } from '../tokens';

export type BadgeStatus =
  | 'confirmed'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'win'
  | 'loss'
  | 'training';

const LABELS: Record<BadgeStatus, string> = {
  confirmed: 'Confermato',
  pending: 'In attesa',
  completed: 'Completato',
  cancelled: 'Annullato',
  disputed: 'In disputa',
  win: 'Vittoria',
  loss: 'Sconfitta',
  training: 'Allenamento',
};

export interface StatusBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const s = tokens.status[status];
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full', className)}
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        letterSpacing: '0.02em',
      }}
    >
      {LABELS[status]}
    </span>
  );
}

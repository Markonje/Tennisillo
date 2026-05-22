import React from 'react';
import { cn } from '../lib/cn';

export type TrainingSessionType = 'SPARRING' | 'MASTER_LESSON';

const CONFIG: Record<TrainingSessionType, { label: string; cls: string; dotCls: string }> = {
  SPARRING: {
    label:  'Sparring',
    cls:    'bg-training-SPARRING/10 border-training-SPARRING/30 text-training-SPARRING',
    dotCls: 'bg-training-SPARRING',
  },
  MASTER_LESSON: {
    label:  'Master Lesson',
    cls:    'bg-training-MASTER_LESSON/10 border-training-MASTER_LESSON/30 text-training-MASTER_LESSON',
    dotCls: 'bg-training-MASTER_LESSON',
  },
};

export interface TrainingSessionBadgeProps {
  type: TrainingSessionType;
  className?: string;
}

export function TrainingSessionBadge({ type, className }: TrainingSessionBadgeProps) {
  const { label, cls, dotCls } = CONFIG[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-0.5 text-[11px] font-semibold',
        cls,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full shrink-0', dotCls)} />
      {label}
    </span>
  );
}

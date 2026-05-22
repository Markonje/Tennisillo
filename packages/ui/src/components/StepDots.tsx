import React from 'react';
import { cn } from '../lib/cn';

export interface StepDotsProps {
  total: number;
  current: number;
  className?: string;
}

export function StepDots({ total, current, className }: StepDotsProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-badge transition-all duration-200',
            i === current
              ? 'bg-accent w-5 h-1.5'
              : 'bg-glass-subtle border border-glass w-1.5 h-1.5',
          )}
        />
      ))}
    </div>
  );
}

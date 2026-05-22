import React from 'react';
import { cn } from '../lib/cn';

export type FrequencyStatus = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

const CONFIG: Record<FrequencyStatus, { label: string; cls: string; dotCls: string }> = {
  GREEN:   { label: 'Alta',  cls: 'bg-frequency-GREEN/10  border-frequency-GREEN/30  text-frequency-GREEN',   dotCls: 'bg-frequency-GREEN'   },
  YELLOW:  { label: 'Media', cls: 'bg-frequency-YELLOW/10 border-frequency-YELLOW/30 text-frequency-YELLOW',  dotCls: 'bg-frequency-YELLOW'  },
  RED:     { label: 'Bassa', cls: 'bg-frequency-RED/10    border-frequency-RED/30    text-frequency-RED',     dotCls: 'bg-frequency-RED'     },
  UNKNOWN: { label: 'N.D.',  cls: 'bg-frequency-UNKNOWN/10 border-frequency-UNKNOWN/30 text-frequency-UNKNOWN', dotCls: 'bg-frequency-UNKNOWN' },
};

export interface FrequencyBadgeProps {
  status: FrequencyStatus;
  className?: string;
}

export function FrequencyBadge({ status, className }: FrequencyBadgeProps) {
  const { label, cls, dotCls } = CONFIG[status];
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

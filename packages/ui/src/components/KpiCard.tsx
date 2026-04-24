import React from 'react';
import { cn } from '../lib/cn';
import { GlassCard } from './GlassCard';

export interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  className?: string;
}

export function KpiCard({ icon, label, value, delta, positive = true, className }: KpiCardProps) {
  return (
    <GlassCard className={cn('p-4 flex flex-col gap-2', className)}>
      <div className="flex items-center gap-2">
        <span className="text-xl leading-none">{icon}</span>
        <span className="text-xs font-semibold text-white/55 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-white leading-none">{value}</span>
        {delta && (
          <span
            className="text-xs font-semibold mb-0.5"
            style={{ color: positive ? '#C8FF78' : '#F09090' }}
          >
            {delta}
          </span>
        )}
      </div>
    </GlassCard>
  );
}

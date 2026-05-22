import React from 'react';
import { cn } from '../lib/cn';
import { GlassCard } from './GlassCard';

export interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  className?: string;
}

export function KpiCard({ icon, label, value, delta, positive = true, className }: KpiCardProps) {
  return (
    <GlassCard interactive className={cn('p-5', className)}>
      <div className="text-xl mb-1.5">{icon}</div>
      <div className="text-[11px] font-medium text-secondary-glass uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="text-3xl font-extrabold text-primary-glass leading-none tracking-tight">
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            'text-[11px] font-semibold mt-1.5',
            positive ? 'text-accent-light' : 'text-danger-light',
          )}
        >
          {positive ? '▲' : '▼'} {delta}
        </div>
      )}
    </GlassCard>
  );
}

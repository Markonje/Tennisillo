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
    <GlassCard style={{ padding: '20px 22px' }} hover className={cn(className)}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.96)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {delta && (
        <div style={{ fontSize: 12, color: positive ? '#b0ef60' : '#f09090', marginTop: 5, fontWeight: 600 }}>
          {positive ? '▲' : '▼'} {delta}
        </div>
      )}
    </GlassCard>
  );
}

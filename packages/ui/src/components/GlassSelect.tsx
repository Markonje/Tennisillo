'use client';

import React from 'react';
import { cn } from '../lib/cn';

type SelectOption = string | { label: string; value: string };

export interface GlassSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

function normalise(opt: SelectOption): { label: string; value: string } {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt;
}

export function GlassSelect({ label, value, onChange, options, className }: GlassSelectProps) {
  return (
    <div className={cn(className)} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'rgba(12,28,36,0.85)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 12,
          padding: '10px 14px',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
        }}
      >
        {options.map((opt) => {
          const { label: l, value: v } = normalise(opt);
          return (
            <option key={v} value={v} style={{ background: '#0c1c24', color: 'rgba(255,255,255,0.9)' }}>
              {l}
            </option>
          );
        })}
      </select>
    </div>
  );
}

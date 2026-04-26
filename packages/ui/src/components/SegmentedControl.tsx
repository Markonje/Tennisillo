import React from 'react';
import { cn } from '../lib/cn';

export interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(className)}
      style={{
        display: 'inline-flex',
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 12,
        padding: 3,
        gap: 2,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.18s ease',
              background: active ? 'rgba(185,255,90,0.2)' : 'transparent',
              color: active ? '#c8ff78' : 'rgba(255,255,255,0.5)',
              boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.15)' : 'none',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

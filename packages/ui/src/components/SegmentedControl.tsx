import React from 'react';
import { cn } from '../lib/cn';
import { tokens } from '../tokens';

export interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn('inline-flex rounded-xl p-1 gap-1', className)}
      style={{
        background: tokens.glass.inputBg,
        backdropFilter: tokens.glass.inputBlur,
        WebkitBackdropFilter: tokens.glass.inputBlur,
        border: tokens.glass.inputBorder,
      }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
              active ? 'text-[#0a1a0e]' : 'text-white/60 hover:text-white/90',
            )}
            style={
              active
                ? {
                    background: 'linear-gradient(135deg,#c8ff6a,#8ee044)',
                    boxShadow: '0 2px 8px rgba(185,255,90,0.30)',
                  }
                : {}
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

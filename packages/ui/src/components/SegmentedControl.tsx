'use client';

import React from 'react';
import { cn } from '../lib/cn';

type Option = string | { label: string; value: string };

function normalise(opt: Option): { label: string; value: string } {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt;
}

export interface SegmentedControlProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  const normalised = options.map(normalise);
  const activeIndex = normalised.findIndex((o) => o.value === value);
  const pct = 100 / options.length;

  return (
    <div
      className={cn(
        'relative inline-flex bg-glass-subtle border border-glass rounded-[12px] p-0.5',
        className,
      )}
    >
      {/* Sliding indicator — inline style justified: position computed from runtime index */}
      <span
        aria-hidden="true"
        className="absolute top-0.5 bottom-0.5 rounded-[10px] bg-accent/20 border border-accent/30 transition-all duration-200 ease-out"
        style={{
          left:  `calc(${activeIndex * pct}% + 2px)`,
          width: `calc(${pct}% - 4px)`,
        }}
      />
      {normalised.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'relative z-10 flex-1 px-3.5 py-1.5 rounded-[10px] text-[13px] font-semibold transition-colors duration-150',
            opt.value === value
              ? 'text-accent-light'
              : 'text-tertiary-glass hover:text-secondary-glass',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

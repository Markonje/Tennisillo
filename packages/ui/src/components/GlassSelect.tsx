'use client';

import React from 'react';
import { cn } from '../lib/cn';

type SelectOption = string | { label: string; value: string };

function normalise(opt: SelectOption): { label: string; value: string } {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt;
}

export interface GlassSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function GlassSelect({ label, value, onChange, options, className }: GlassSelectProps) {
  const id = label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[11px] font-medium text-tertiary-glass uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full appearance-none rounded-input border border-glass bg-[#0c1c24]',
            'px-3.5 py-2.5 pr-9 text-sm text-primary-glass cursor-pointer',
            'transition-all duration-150 outline-none',
            'focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(185,255,90,0.12)]',
          )}
        >
          {options.map((opt) => {
            const { label: l, value: v } = normalise(opt);
            return (
              <option key={v} value={v} className="bg-[#0c1c24] text-white/90">
                {l}
              </option>
            );
          })}
        </select>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-tertiary-glass">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 4.5L6 8.5L10 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}

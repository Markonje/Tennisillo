'use client';

import React from 'react';
import { cn } from '../lib/cn';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
}

export function Toggle({ checked, onChange, size = 'md', disabled, className }: ToggleProps) {
  // Thumb translate values: (track-width - thumb-size - left-offset)
  // sm: 36px track, 14px thumb → checked offset = 36-14-2 = 20px
  // md: 44px track, 16px thumb → checked offset = 44-16-4 = 24px
  const thumbTranslate = checked
    ? size === 'sm' ? 'translate-x-5' : 'translate-x-6'
    : size === 'sm' ? 'translate-x-0.5' : 'translate-x-1';

  return (
    <button
      role="switch"
      type="button"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center cursor-pointer rounded-badge border transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'border-accent bg-accent' : 'border-glass bg-glass-subtle',
        className,
      )}
    >
      <span
        className={cn(
          'pointer-events-none block rounded-full bg-white shadow-sm transition-transform duration-200',
          size === 'sm' ? 'size-3.5' : 'size-4',
          thumbTranslate,
        )}
      />
    </button>
  );
}

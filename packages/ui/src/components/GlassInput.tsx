'use client';

import React from 'react';
import { cn } from '../lib/cn';

export interface GlassInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
}

export function GlassInput({
  label,
  value,
  onChange,
  iconLeft,
  iconRight,
  className,
  type = 'text',
  placeholder,
  disabled,
  id,
  ...rest
}: GlassInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[11px] font-medium text-tertiary-glass uppercase tracking-wider"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {iconLeft && (
          <span className="absolute left-3 text-tertiary-glass pointer-events-none flex items-center">
            {iconLeft}
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full rounded-input border border-glass bg-glass-input backdrop-glass',
            'px-3.5 py-2.5 text-sm text-primary-glass placeholder:text-muted-glass',
            'transition-all duration-150 outline-none',
            'focus:bg-glass-input-focus focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(185,255,90,0.12)]',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            iconLeft  && 'pl-9',
            iconRight && 'pr-9',
          )}
          {...rest}
        />
        {iconRight && (
          <span className="absolute right-3 text-tertiary-glass pointer-events-none flex items-center">
            {iconRight}
          </span>
        )}
      </div>
    </div>
  );
}

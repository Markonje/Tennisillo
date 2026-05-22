'use client';

import React from 'react';
import { cn } from '../lib/cn';

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Textarea({
  label,
  value,
  onChange,
  className,
  id,
  placeholder,
  disabled,
  rows = 4,
  ...rest
}: TextareaProps) {
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
      <textarea
        id={inputId}
        value={value}
        rows={rows}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'w-full rounded-input border border-glass bg-glass-input backdrop-glass',
          'px-3.5 py-2.5 text-sm text-primary-glass placeholder:text-muted-glass',
          'transition-all duration-150 outline-none resize-y',
          'focus:bg-glass-input-focus focus:border-accent/50 focus:shadow-[0_0_0_3px_rgba(185,255,90,0.12)]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        )}
        {...rest}
      />
    </div>
  );
}

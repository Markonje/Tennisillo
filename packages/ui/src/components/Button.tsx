'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const button = cva(
  [
    'inline-flex items-center justify-center gap-1.5 font-semibold cursor-pointer',
    'transition-all duration-150 select-none',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
  ],
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-accent-light to-accent-dark text-[#0a1a0e] font-bold rounded-btn shadow-accent-glow hover:shadow-accent-glow-lg hover:-translate-y-px active:translate-y-0',
        secondary:
          'bg-glass-input border border-glass backdrop-glass text-primary-glass rounded-btn hover:border-glass-hover hover:bg-glass-card',
        danger:
          'bg-danger/10 border border-danger/40 text-danger-light rounded-btn hover:bg-danger/20',
        warning:
          'bg-warning/10 border border-warning/40 text-warning-light rounded-btn hover:bg-warning/20',
        ghost:
          'text-secondary-glass rounded-btn hover:bg-glass-subtle hover:text-primary-glass',
      },
      size: {
        sm: 'px-4 py-1.5 text-xs',
        md: 'px-5 py-2.5 text-sm',
        lg: 'px-7 py-3 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    VariantProps<typeof button> {
  children: React.ReactNode;
  loading?: boolean;
}

export function Button({
  variant,
  size,
  className,
  children,
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(button({ variant, size }), className)}
      disabled={disabled ?? loading}
      {...rest}
    >
      {loading && (
        <span className="size-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}

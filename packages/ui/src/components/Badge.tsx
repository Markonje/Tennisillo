import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-badge text-[11px] font-semibold tracking-wide px-2.5 py-0.5',
  {
    variants: {
      tone: {
        green:  'bg-success/10 text-accent-light border border-success/30',
        yellow: 'bg-warning/10 text-warning-light border border-warning/30',
        red:    'bg-danger/10  text-danger-light  border border-danger/30',
        blue:   'bg-blue-faint text-blue-light    border border-[rgba(121,167,216,0.3)]',
        gray:   'bg-glass-subtle text-tertiary-glass border border-glass',
      },
    },
    defaultVariants: { tone: 'gray' },
  }
);

const DOT_CLASS: Record<string, string> = {
  green:  'bg-success',
  yellow: 'bg-warning',
  red:    'bg-danger',
  blue:   'bg-blue',
  gray:   'bg-white/30',
};

export interface BadgeProps extends VariantProps<typeof badge> {
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export function Badge({ tone = 'gray', dot, children, className }: BadgeProps) {
  return (
    <span className={cn(badge({ tone }), className)}>
      {dot && (
        <span className={cn('size-1.5 rounded-full shrink-0', DOT_CLASS[tone ?? 'gray'])} />
      )}
      {children}
    </span>
  );
}

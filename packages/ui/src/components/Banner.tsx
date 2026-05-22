import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const banner = cva(
  'flex items-start gap-3 rounded-card border px-5 py-4 text-sm',
  {
    variants: {
      tone: {
        info:    'bg-blue-faint border-[rgba(121,167,216,0.25)] text-blue-light',
        success: 'bg-success/10 border-success/25 text-accent-light',
        warning: 'bg-warning/10 border-warning/25 text-warning-light',
        danger:  'bg-danger/10  border-danger/25  text-danger-light',
      },
    },
    defaultVariants: { tone: 'info' },
  }
);

const ICONS: Record<string, string> = {
  info:    'ℹ',
  success: '✓',
  warning: '!',
  danger:  '✕',
};

export interface BannerProps extends VariantProps<typeof banner> {
  children: React.ReactNode;
  className?: string;
}

export function Banner({ tone = 'info', children, className }: BannerProps) {
  return (
    <div role="alert" className={cn(banner({ tone }), className)}>
      <span className="text-base font-bold shrink-0 mt-px" aria-hidden="true">
        {ICONS[tone ?? 'info']}
      </span>
      <div>{children}</div>
    </div>
  );
}

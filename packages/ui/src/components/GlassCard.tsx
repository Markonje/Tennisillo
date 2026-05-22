'use client';

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const card = cva(
  'relative rounded-card border border-glass bg-glass-card backdrop-glass shadow-glass transition-all duration-200',
  {
    variants: {
      interactive: {
        true:  'cursor-pointer hover:bg-glass-card-hover hover:border-glass-hover hover:-translate-y-0.5 hover:shadow-glass-hover',
        false: '',
      },
    },
    defaultVariants: { interactive: false },
  }
);

export interface GlassCardProps extends VariantProps<typeof card> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  as?: React.ElementType;
  /** @deprecated use interactive */
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  style,
  onClick,
  as: Tag = 'div',
  interactive,
  hover,
}: GlassCardProps) {
  return (
    <Tag
      className={cn(card({ interactive: interactive ?? hover ?? false }), className)}
      style={style}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}

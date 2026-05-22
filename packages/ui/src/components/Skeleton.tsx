import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const skeleton = cva('animate-pulse bg-glass-subtle', {
  variants: {
    variant: {
      text:   'h-3 w-full rounded',
      circle: 'rounded-full',
      rect:   'rounded-card',
    },
  },
  defaultVariants: { variant: 'rect' },
});

export interface SkeletonProps extends VariantProps<typeof skeleton> {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ variant, className, width, height }: SkeletonProps) {
  return (
    <div
      className={cn(skeleton({ variant }), className)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

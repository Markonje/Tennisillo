import React from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps {
  initials: string;
  hue: string;
  size?: number;
  className?: string;
}

export function Avatar({ initials, hue, size = 36, className }: AvatarProps) {
  return (
    <div
      className={cn('inline-flex items-center justify-center shrink-0 font-semibold select-none', className)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        fontSize: size * 0.38,
        background: `linear-gradient(135deg, oklch(0.62 0.18 ${hue}), oklch(0.48 0.22 ${hue}))`,
        border: `1.5px solid oklch(0.75 0.12 ${hue} / 0.5)`,
        boxShadow: `0 2px 12px oklch(0.55 0.20 ${hue} / 0.35)`,
        color: '#fff',
        letterSpacing: '0.03em',
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

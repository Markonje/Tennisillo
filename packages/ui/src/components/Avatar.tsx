import React from 'react';
import { cn } from '../lib/cn';

export interface AvatarProps {
  initials: string;
  hue: string | number;
  size?: number;
  className?: string;
}

export function Avatar({ initials, hue, size = 36, className }: AvatarProps) {
  const h = String(hue);
  return (
    <div
      className={cn(
        'shrink-0 select-none flex items-center justify-center font-bold',
        className,
      )}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, oklch(0.72 0.18 ${h}), oklch(0.55 0.22 ${h}))`,
        fontSize: size * 0.36,
        color: 'rgba(0,0,0,0.75)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        boxShadow: `0 0 14px oklch(0.65 0.18 ${h} / 0.35)`,
        letterSpacing: '-0.02em',
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

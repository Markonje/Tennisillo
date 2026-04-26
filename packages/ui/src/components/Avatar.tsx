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
      className={cn(className)}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `linear-gradient(135deg, oklch(0.72 0.18 ${hue}), oklch(0.55 0.22 ${hue}))`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        color: 'rgba(0,0,0,0.75)',
        border: '1.5px solid rgba(255,255,255,0.25)',
        boxShadow: `0 0 14px oklch(0.65 0.18 ${hue} / 0.35)`,
        letterSpacing: '-0.02em',
        userSelect: 'none',
      }}
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}

import React from 'react';
import { cn } from '../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const BASE =
  'inline-flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2';

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  style,
  onMouseEnter,
  onMouseLeave,
  ...rest
}: ButtonProps) {
  const [hovered, setHovered] = React.useState(false);

  const padding = size === 'sm' ? '7px 16px' : '10px 22px';
  const fontSize = size === 'sm' ? 12 : 14;

  let computedStyle: React.CSSProperties = {
    padding,
    fontSize,
    borderRadius: 14,
    transition: 'all 0.18s ease',
    gap: 6,
  };

  if (variant === 'primary') {
    computedStyle = {
      ...computedStyle,
      background: hovered
        ? 'linear-gradient(135deg,#d8ff88,#a0ef5a)'
        : 'linear-gradient(135deg,#c8ff6a,#8ee044)',
      color: '#0a1a0e',
      fontWeight: 700,
      border: 'none',
      boxShadow: `0 8px 24px rgba(185,255,90,${hovered ? 0.4 : 0.25})`,
      transform: hovered ? 'translateY(-1px)' : 'none',
    };
  } else if (variant === 'secondary') {
    computedStyle = {
      ...computedStyle,
      background: hovered ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.09)',
      color: 'rgba(255,255,255,0.88)',
      border: '1px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(12px)',
      fontWeight: 600,
    };
  } else {
    computedStyle = {
      ...computedStyle,
      background: hovered ? 'rgba(233,109,109,0.22)' : 'rgba(233,109,109,0.12)',
      color: '#f09090',
      border: '1px solid rgba(233,109,109,0.4)',
      backdropFilter: 'blur(12px)',
      fontWeight: 600,
    };
  }

  return (
    <button
      className={cn(BASE, className)}
      style={{ ...computedStyle, ...style }}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...rest}
    >
      {children}
    </button>
  );
}

import React from 'react';
import { cn } from '../lib/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const BASE =
  'inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2';

const SIZE: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
};

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'text-[#0a1a0e] focus-visible:ring-[#B9FF5A]/60',
  secondary: 'text-white/80 hover:text-white focus-visible:ring-white/30',
  danger: 'text-[#F09090] hover:text-white focus-visible:ring-[#FF3B30]/50',
};

const VARIANT_STYLE: Record<
  NonNullable<ButtonProps['variant']>,
  { default: React.CSSProperties; hover?: React.CSSProperties }
> = {
  primary: {
    default: {
      background: 'linear-gradient(135deg,#c8ff6a,#8ee044)',
      borderRadius: 14,
      boxShadow: '0 4px 20px rgba(185,255,90,0.25)',
    },
  },
  secondary: {
    default: {
      background: 'rgba(255,255,255,0.09)',
      border: '1px solid rgba(255,255,255,0.18)',
      backdropFilter: 'blur(12px)',
      borderRadius: 14,
    },
  },
  danger: {
    default: {
      background: 'rgba(233,109,109,0.12)',
      border: '1px solid rgba(233,109,109,0.35)',
      backdropFilter: 'blur(12px)',
      borderRadius: 14,
    },
  },
};

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

  const baseStyle = VARIANT_STYLE[variant].default;
  const hoverStyle =
    variant === 'primary' && hovered
      ? {
          background: 'linear-gradient(135deg,#d4ff7a,#9cf050)',
          boxShadow: '0 6px 28px rgba(185,255,90,0.40)',
          transform: 'translateY(-1px)',
        }
      : variant === 'secondary' && hovered
        ? { background: 'rgba(255,255,255,0.14)', transform: 'translateY(-1px)' }
        : variant === 'danger' && hovered
          ? { background: 'rgba(233,109,109,0.22)', transform: 'translateY(-1px)' }
          : {};

  return (
    <button
      className={cn(BASE, SIZE[size], VARIANT_CLASS[variant], className)}
      style={{ ...baseStyle, ...hoverStyle, ...style }}
      onMouseEnter={(e) => { setHovered(true); onMouseEnter?.(e); }}
      onMouseLeave={(e) => { setHovered(false); onMouseLeave?.(e); }}
      {...rest}
    >
      {children}
    </button>
  );
}

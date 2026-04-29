'use client';

import React from 'react';
import { cn } from '../lib/cn';
import { tokens } from '../tokens';

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  hover?: boolean;
  as?: React.ElementType;
}

export function GlassCard({
  children,
  className,
  style,
  onClick,
  hover = false,
  as: Tag = 'div',
}: GlassCardProps) {
  const [hovered, setHovered] = React.useState(false);

  const isActive = hover && hovered;

  return (
    <Tag
      className={cn('relative', hover && 'cursor-pointer', className)}
      style={{
        background: isActive ? tokens.glass.cardBgHover : tokens.glass.cardBg,
        backdropFilter: tokens.glass.cardBlur,
        WebkitBackdropFilter: tokens.glass.cardBlur,
        border: tokens.glass.cardBorder,
        borderRadius: 20,
        boxShadow: isActive ? tokens.glass.cardShadowHover : tokens.glass.cardShadow,
        transition: 'all 0.22s ease',
        transform: isActive ? 'translateY(-2px)' : 'none',
        ...style,
      }}
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
    >
      {children}
    </Tag>
  );
}

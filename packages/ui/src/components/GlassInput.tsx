'use client';

import React from 'react';
import { cn } from '../lib/cn';

export interface GlassInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  placeholder?: string;
  className?: string;
}

export function GlassInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  className,
}: GlassInputProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={cn(className)} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && (
        <label style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          background: focused ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
          border: `1px solid ${focused ? 'rgba(185,255,90,0.5)' : 'rgba(255,255,255,0.14)'}`,
          borderRadius: 12,
          padding: '10px 14px',
          color: 'rgba(255,255,255,0.9)',
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          backdropFilter: 'blur(12px)',
          boxShadow: focused ? '0 0 0 3px rgba(185,255,90,0.12)' : 'none',
          transition: 'all 0.18s ease',
        }}
      />
    </div>
  );
}

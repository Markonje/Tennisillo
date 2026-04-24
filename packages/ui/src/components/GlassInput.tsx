import React from 'react';
import { cn } from '../lib/cn';
import { tokens } from '../tokens';

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
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
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
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-all duration-200"
        style={{
          background: focused ? tokens.glass.inputBgFocus : tokens.glass.inputBg,
          backdropFilter: tokens.glass.inputBlur,
          WebkitBackdropFilter: tokens.glass.inputBlur,
          border: focused ? tokens.glass.inputBorderFocus : tokens.glass.inputBorder,
          boxShadow: focused ? `0 0 0 3px rgba(185,255,90,0.12)` : 'none',
        }}
      />
    </div>
  );
}

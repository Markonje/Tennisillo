import React from 'react';
import { cn } from '../lib/cn';
import { tokens } from '../tokens';

type SelectOption = string | { label: string; value: string };

export interface GlassSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

function normalise(opt: SelectOption): { label: string; value: string } {
  return typeof opt === 'string' ? { label: opt, value: opt } : opt;
}

export function GlassSelect({ label, value, onChange, options, className }: GlassSelectProps) {
  const [focused, setFocused] = React.useState(false);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label className="text-xs font-semibold text-white/60 uppercase tracking-wider">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full rounded-xl px-4 py-2.5 text-sm text-white outline-none appearance-none transition-all duration-200 cursor-pointer"
        style={{
          background: focused ? tokens.glass.inputBgFocus : tokens.glass.inputBg,
          backdropFilter: tokens.glass.inputBlur,
          WebkitBackdropFilter: tokens.glass.inputBlur,
          border: focused ? tokens.glass.inputBorderFocus : tokens.glass.inputBorder,
          boxShadow: focused ? '0 0 0 3px rgba(185,255,90,0.12)' : 'none',
        }}
      >
        {options.map((opt) => {
          const { label: l, value: v } = normalise(opt);
          return (
            <option key={v} value={v} style={{ background: '#1a2a18', color: '#fff' }}>
              {l}
            </option>
          );
        })}
      </select>
    </div>
  );
}

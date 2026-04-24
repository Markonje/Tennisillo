// packages/ui/src/tailwind.preset.ts
// Tailwind preset consumed by apps/web/tailwind.config.ts
// Do not duplicate tokens here — import from tokens.ts.

import { tokens } from './tokens';
import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        neutral: tokens.colors.neutral,
        success: tokens.colors.success,
        warning: tokens.colors.warning,
        error: tokens.colors.error,
        info: tokens.colors.info,
        frequency: tokens.colors.frequency,
        training: tokens.colors.training,
        venue: tokens.colors.venue,
        // Semantic CSS variable mappings — required by shadcn/ui and globals.css
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
      },
      fontFamily: {
        // Spread to convert `readonly` tuple → mutable string[] expected by Tailwind
        sans: [...tokens.typography.fontFamily.sans],
        mono: [...tokens.typography.fontFamily.mono],
      },
      // Cast needed: tokens are `as const` (readonly tuples) but Tailwind expects mutable tuples
      fontSize: tokens.typography.fontSize as unknown as NonNullable<Config['theme']>['fontSize'],
      spacing: tokens.spacing,
      borderRadius: {
        // Static tokens from design system
        ...tokens.borderRadius,
        // CSS variable overrides — required by shadcn/ui components
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: tokens.shadows,
    },
  },
};

export default preset;

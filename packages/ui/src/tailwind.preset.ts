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
      },
      fontFamily: {
        sans: tokens.typography.fontFamily.sans,
        mono: tokens.typography.fontFamily.mono,
      },
      fontSize: tokens.typography.fontSize as Config['theme']['fontSize'],
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
    },
  },
};

export default preset;

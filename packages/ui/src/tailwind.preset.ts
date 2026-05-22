// packages/ui/src/tailwind.preset.ts
// Tennisillo Tailwind preset — exposes the glass design system as utility classes.
// Consumed by apps/web/tailwind.config.ts via @tennisillo/ui/tailwind.
// Do not duplicate token values here — import from tokens.ts.

import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';
import { colors, glass, APP_BG } from './tokens';

// Plugin that adds composite glass utilities not expressible via theme keys alone
const glassPlugin = plugin((api) => {
  api.addUtilities({
    // Background gradients
    '.bg-app': {
      background: APP_BG,
    },
    '.bg-glass-card': {
      background: glass.cardBg,
    },
    '.bg-glass-card-hover': {
      background: glass.cardBgHover,
    },
    '.bg-glass-input': {
      background: glass.inputBg,
    },
    '.bg-glass-input-focus': {
      background: glass.inputBgFocus,
    },
    '.bg-glass-subtle': {
      background: colors.glass05,
    },
    // Border color utilities (pair with border / border-* width utilities)
    '.border-glass': {
      borderColor: colors.glassBorder,
    },
    '.border-glass-hover': {
      borderColor: colors.glassBorderHov,
    },
    // Combined backdrop filter (blur + saturate in one class)
    '.backdrop-glass': {
      backdropFilter: glass.cardBlur,
      '-webkit-backdrop-filter': glass.cardBlur,
    },
    // Text colour utilities using glass text scale
    '.text-primary-glass': {
      color: colors.textPrimary,
    },
    '.text-secondary-glass': {
      color: colors.textSecondary,
    },
    '.text-tertiary-glass': {
      color: colors.textTertiary,
    },
    '.text-muted-glass': {
      color: colors.textMuted,
    },
  });
});

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // Accent lime
        accent: {
          DEFAULT: colors.accent,
          light:   colors.accentLight,
          dark:    colors.accentDark,
        },
        // Ice blue
        blue: {
          DEFAULT: colors.blue,
          light:   colors.blueLight,
          faint:   colors.blueFaint,
        },
        // Semantic danger
        danger: {
          DEFAULT: colors.danger,
          light:   colors.dangerLight,
          faint:   colors.dangerFaint,
        },
        // Semantic warning
        warning: {
          DEFAULT: colors.warning,
          light:   colors.warningLight,
          faint:   colors.warningFaint,
        },
        // Success (alias for accent lime)
        success: colors.success,
        // v2.0 domain colours
        frequency: {
          GREEN:   colors.frequency.GREEN,
          YELLOW:  colors.frequency.YELLOW,
          RED:     colors.frequency.RED,
          UNKNOWN: colors.frequency.UNKNOWN,
        },
        training: {
          SPARRING:      colors.training.SPARRING,
          MASTER_LESSON: colors.training.MASTER_LESSON,
        },
        venue: {
          ACTIVE:   colors.venue.ACTIVE,
          PENDING:  colors.venue.PENDING,
          ARCHIVED: colors.venue.ARCHIVED,
        },
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', '"Fira Mono"', '"Roboto Mono"', 'monospace'],
      },

      borderRadius: {
        card:  '20px',
        input: '11px',
        btn:   '12px',
        badge: '999px',
        icon:  '10px',
        chip:  '8px',
      },

      boxShadow: {
        glass:            glass.cardShadow,
        'glass-hover':    glass.cardShadowHover,
        'accent-glow':    '0 6px 20px rgba(185,255,90,0.22)',
        'accent-glow-lg': '0 8px 28px rgba(185,255,90,0.40)',
      },

      animation: {
        'fade-up':  'fadeUp 0.3s ease both',
        'slide-in': 'slideIn 0.22s ease both',
        'modal-in': 'modalIn 0.2s ease both',
        'fade-in':  'fadeIn 0.2s ease both',
        'splash-in':'splashIn 0.6s ease both',
        'blob-a':   'blobA 8s ease-in-out infinite alternate',
        'blob-b':   'blobB 11s ease-in-out infinite alternate',
      },

      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.96) translateY(8px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        splashIn: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        blobA: {
          from: { transform: 'scale(1) translate(0, 0)' },
          to:   { transform: 'scale(1.18) translate(30px, -20px)' },
        },
        blobB: {
          from: { transform: 'scale(1) translate(0, 0)' },
          to:   { transform: 'scale(1.22) translate(-25px, 30px)' },
        },
      },
    },
  },

  plugins: [glassPlugin],
};

export default preset;

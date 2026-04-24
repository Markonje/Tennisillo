// packages/ui/src/tokens.ts
// Source: docs/specs/02_specifiche_sviluppo.md §11 (v1.0) + §11.1 (v2.0 additions)
// Apple-inspired design system tokens.

export const tokens = {
  colors: {
    // Primary palette — iOS Blue
    primary: {
      50: '#EBF5FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#007AFF', // SystemBlue iOS
      600: '#0066D6',
      700: '#0052A8',
      800: '#003D7A',
      900: '#00284D',
    },

    // Neutral — matches iOS gray scale
    neutral: {
      50: '#F9F9F9',
      100: '#F2F2F7', // iOS systemGroupedBackground
      200: '#E5E5EA',
      300: '#D1D1D6',
      400: '#AEAEB2',
      500: '#8E8E93', // iOS SystemGray
      600: '#636366',
      700: '#48484A',
      800: '#3A3A3C',
      900: '#1C1C1E', // iOS label dark
    },

    // Semantic — iOS system colors
    success: '#34C759',   // SystemGreen
    warning: '#FF9500',   // SystemOrange
    error: '#FF3B30',     // SystemRed
    info: '#5AC8FA',      // SystemTeal

    // [NEW-v2] Frequency traffic-light
    frequency: {
      GREEN: '#34C759',  // under idealFrequency — "play more"
      YELLOW: '#FFCC00', // between ideal and max
      RED: '#FF3B30',    // at or above maxFrequency
      UNKNOWN: '#8E8E93',
    },

    // [NEW-v2] Training session type
    training: {
      SPARRING: '#5AC8FA',      // SystemTeal
      MASTER_LESSON: '#BF5AF2', // SystemPurple
    },

    // [NEW-v2] Venue status
    venue: {
      ACTIVE: '#34C759',
      PENDING: '#FF9500',
      ARCHIVED: '#8E8E93',
    },
  },

  typography: {
    fontFamily: {
      sans: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"SF Pro Display"',
        '"SF Pro Text"',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ],
      mono: ['"SF Mono"', '"Fira Code"', '"Fira Mono"', '"Roboto Mono"', 'monospace'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },

  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },

  borderRadius: {
    none: '0px',
    sm: '6px',
    DEFAULT: '10px', // iOS-style rounded
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 2px 8px 0 rgb(0 0 0 / 0.08)',
    md: '0 4px 12px 0 rgb(0 0 0 / 0.10)',
    lg: '0 8px 24px 0 rgb(0 0 0 / 0.12)',
    xl: '0 16px 48px 0 rgb(0 0 0 / 0.16)',
    card: '0 2px 8px 0 rgb(0 0 0 / 0.08), 0 0 0 1px rgb(0 0 0 / 0.04)',
  },
  // Glass morphism values — used via style prop (not Tailwind)
  glass: {
    cardBg: 'linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))',
    cardBgHover: 'linear-gradient(135deg,rgba(255,255,255,0.15),rgba(255,255,255,0.07))',
    cardBorder: '1px solid rgba(255,255,255,0.14)',
    cardBlur: 'blur(26px) saturate(140%)',
    cardShadow: '0 14px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.18)',
    cardShadowHover: '0 20px 50px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.2)',
    inputBg: 'rgba(255,255,255,0.07)',
    inputBgFocus: 'rgba(255,255,255,0.12)',
    inputBorder: '1px solid rgba(255,255,255,0.14)',
    inputBorderFocus: '1px solid rgba(185,255,90,0.5)',
    inputBlur: 'blur(12px)',
    modalBg: 'linear-gradient(135deg,rgba(255,255,255,0.16),rgba(255,255,255,0.08))',
    modalBlur: 'blur(36px) saturate(150%)',
    overlayBg: 'rgba(0,0,0,0.55)',
    overlayBlur: 'blur(10px)',
  },

  // Accent lime
  accent: {
    DEFAULT: '#B9FF5A',
    light: '#C8FF78',
    dark: '#8EE044',
    muted: '#B0EF60',
    text: '#C8FF78',
    bg: 'rgba(185,255,90,0.12)',
    bgHover: 'rgba(185,255,90,0.20)',
    border: 'rgba(185,255,90,0.35)',
    shadow: 'rgba(185,255,90,0.25)',
    shadowHover: 'rgba(185,255,90,0.40)',
  },

  // Status colors
  status: {
    confirmed: { bg: 'rgba(185,255,90,0.18)',  border: 'rgba(185,255,90,0.4)',  text: '#C8FF78'  },
    pending:   { bg: 'rgba(242,211,94,0.18)',  border: 'rgba(242,211,94,0.4)',  text: '#F5D96A'  },
    completed: { bg: 'rgba(121,167,216,0.18)', border: 'rgba(121,167,216,0.4)', text: '#9ABFDD'  },
    cancelled: { bg: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.15)', text: 'rgba(255,255,255,0.5)' },
    disputed:  { bg: 'rgba(233,109,109,0.18)', border: 'rgba(233,109,109,0.4)', text: '#F09090'  },
    win:       { bg: 'rgba(185,255,90,0.18)',  border: 'rgba(185,255,90,0.4)',  text: '#C8FF78'  },
    loss:      { bg: 'rgba(233,109,109,0.18)', border: 'rgba(233,109,109,0.4)', text: '#F09090'  },
    training:  { bg: 'rgba(121,167,216,0.18)', border: 'rgba(121,167,216,0.4)', text: '#9ABFDD'  },
  },
} as const;

export type Tokens = typeof tokens;

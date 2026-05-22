// packages/ui/src/tokens.ts
// Single source of truth for the Tennisillo glass design system.
// Replaces the old Apple-iOS palette. See ADR 004 for rationale.

// --- Palette ---

export const colors = {
  // App background layers
  bgBase:        '#0B1A1C',
  bgDeep:        '#071517',
  bgMid:         '#17304A',

  // Primary accent — lime green
  accent:        '#B9FF5A',
  accentLight:   '#c8ff78',
  accentDark:    '#8ee044',
  accentGlow:    'rgba(185,255,90,0.22)',

  // Secondary accent — ice blue
  blue:          'rgba(121,167,216,1)',
  blueLight:     '#9abfdd',
  blueFaint:     'rgba(121,167,216,0.18)',

  // Semantic
  danger:        '#E96D6D',
  dangerLight:   '#f09090',
  dangerFaint:   'rgba(233,109,109,0.12)',
  warning:       '#F2D35E',
  warningLight:  '#f5d96a',
  warningFaint:  'rgba(242,211,94,0.12)',
  success:       '#B9FF5A',

  // Glass surface layers
  glass11:       'rgba(255,255,255,0.11)',
  glass07:       'rgba(255,255,255,0.07)',
  glass05:       'rgba(255,255,255,0.05)',
  glassBorder:   'rgba(255,255,255,0.13)',
  glassBorderHov:'rgba(255,255,255,0.22)',

  // Text scale
  textPrimary:   'rgba(255,255,255,0.97)',
  textSecondary: 'rgba(255,255,255,0.70)',
  textTertiary:  'rgba(255,255,255,0.42)',
  textMuted:     'rgba(255,255,255,0.28)',

  // v2.0 domain tokens — preserved, do not remove
  frequency: {
    GREEN:   '#34C759',
    YELLOW:  '#FFCC00',
    RED:     '#FF3B30',
    UNKNOWN: '#8E8E93',
  },
  training: {
    SPARRING:      '#5AC8FA',
    MASTER_LESSON: '#BF5AF2',
  },
  venue: {
    ACTIVE:   '#34C759',
    PENDING:  '#FF9500',
    ARCHIVED: '#8E8E93',
  },
} as const;

// --- Shape ---

export const radius = {
  card:   20,
  input:  11,
  btn:    12,
  badge:  999,
  avatar: '50%',
  icon:   10,
  chip:   8,
} as const;

export const spacing = {
  cardPad:   '22px 24px',
  cardPadSm: '16px 20px',
  sidebarW:  230,
  mainPad:   '26px 30px',
  gap:       14,
  gapSm:     10,
} as const;

// --- Typography ---

export const typography = {
  h1:        { fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' },
  h2:        { fontSize: 18, fontWeight: 800, letterSpacing: '-0.02em' },
  h3:        { fontSize: 15, fontWeight: 700 },
  body:      { fontSize: 13, fontWeight: 400 },
  labelCaps: { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const },
  mono:      { fontFamily: 'monospace', fontWeight: 700 },
} as const;

// --- Glass morphism values ---

export const glass = {
  cardBg:          'linear-gradient(135deg, rgba(255,255,255,0.11), rgba(255,255,255,0.05))',
  cardBgHover:     'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.07))',
  // Includes '1px solid' for direct use in border CSS property
  cardBorder:      '1px solid rgba(255,255,255,0.13)',
  cardBlur:        'blur(26px) saturate(140%)',
  cardShadow:      '0 14px 40px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.16)',
  cardShadowHover: '0 22px 55px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.2)',
  inputBg:         'rgba(255,255,255,0.07)',
  inputBgFocus:    'rgba(255,255,255,0.12)',
  inputBorderFocus:'rgba(185,255,90,0.5)',
  overlayBg:       'rgba(0,0,0,0.55)',
  overlayBlur:     'blur(10px)',
} as const;

// --- Animation durations (seconds) ---

export const animations = {
  fadeUp:  '0.3s',
  slideIn: '0.22s',
  modalIn: '0.2s',
  hover:   '0.16s',
} as const;

// --- App background gradient ---

export const APP_BG =
  'radial-gradient(ellipse at 8% 0%, rgba(185,255,90,0.12) 0%, transparent 28%), ' +
  'radial-gradient(ellipse at 85% 15%, rgba(121,167,216,0.18) 0%, transparent 30%), ' +
  'linear-gradient(145deg, #071517 0%, #17304A 52%, #0B1A1C 100%)';

// --- Aggregated export (backward compat for existing components during migration) ---

export const tokens = {
  colors,
  radius,
  spacing,
  typography,
  glass,
  animations,
} as const;

export type Tokens = typeof tokens;

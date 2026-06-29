// Quick-Job Design System
// A vibrant, trustworthy palette for a gig-economy marketplace
// Primary: Deep Indigo  |  Accent: Electric Violet  |  Success: Emerald  |  Surface: Cool White

export const Colors = {
  // Brand
  primary: '#4F46E5',       // Deep Indigo — authority, trust
  primaryLight: '#818CF8',  // Soft Indigo — hover/tint
  primaryDark: '#3730A3',   // Dark Indigo — pressed state
  accent: '#7C3AED',        // Electric Violet — CTAs, accents
  accentLight: '#A78BFA',

  // Semantic
  success: '#059669',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  info: '#0284C7',
  infoLight: '#E0F2FE',

  // Neutrals
  white: '#FFFFFF',
  gray50: '#F8FAFC',
  gray100: '#F1F5F9',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',

  // Background layers
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Gradients (used as array in LinearGradient)
  gradientPrimary: ['#4F46E5', '#7C3AED'],
  gradientSuccess: ['#059669', '#10B981'],
  gradientWarm: ['#F59E0B', '#EF4444'],
  gradientCool: ['#0EA5E9', '#6366F1'],
  gradientNearby: ['#667EEA', '#764BA2'],
  gradientPost: ['#43E97B', '#38F9D7'],
  gradientSearch: ['#FA709A', '#FEE140'],
  gradientProfile: ['#4FACFE', '#00F2FE'],
};

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,

  // Font weights (string for RN)
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',

  // Line heights
  tight: 1.2,
  normal_lh: 1.5,
  relaxed: 1.75,
};

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const Radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};

// React Native Paper theme
export const PaperTheme = {
  colors: {
    primary: Colors.primary,
    accent: Colors.accent,
    background: Colors.background,
    surface: Colors.surface,
    error: Colors.error,
    text: Colors.textPrimary,
    onSurface: Colors.textPrimary,
    disabled: Colors.gray300,
    placeholder: Colors.gray400,
    backdrop: 'rgba(0,0,0,0.5)',
  },
};

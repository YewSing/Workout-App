/**
 * MyWorkoutApp Design System
 * ===========================
 * Central source of truth for colors, typography, spacing, shadows, and radii.
 * All screens and components should import from here — never hard-code values.
 */

import { Platform } from 'react-native';

// ─── Color Palette ────────────────────────────────────────────────────────────

export const Palette = {
  background: '#EBEBEB',       // Primary page background (light gray)
  surface: '#FFFFFF',          // Card / element background (white)
  surfaceAlt: '#F2F2F2',       // Subtle alternate surface (inputs, secondary cards)
  primary: '#FFFFFF',          // Selected element fill
  accent: '#DE6645',           // Highlight / CTA — use sparingly
  accentLight: 'rgba(222, 102, 69, 0.12)', // Accent tint for icon backgrounds
  textPrimary: '#1A1A1A',      // Main body text
  textSecondary: '#999999',    // Labels, captions, placeholders
  textOnAccent: '#FFFFFF',     // Text on accent-colored surfaces
  border: '#E0E0E0',          // Subtle borders & dividers
  danger: '#E53935',           // Destructive actions
  dangerLight: 'rgba(229, 57, 53, 0.10)',
  success: '#43A047',          // Positive feedback
  iconDefault: '#888888',      // Unselected icons
  shadow: 'rgba(0, 0, 0, 0.06)', // Card shadows
  overlay: 'rgba(0, 0, 0, 0.4)', // Modal overlay
};

// Legacy Colors object (kept for backward compatibility with useThemeColor hook)
export const Colors = {
  light: {
    text: Palette.textPrimary,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.iconDefault,
    tabIconDefault: Palette.iconDefault,
    tabIconSelected: Palette.accent,
  },
  dark: {
    text: Palette.textPrimary,
    background: Palette.background,
    tint: Palette.accent,
    icon: Palette.iconDefault,
    tabIconDefault: Palette.iconDefault,
    tabIconSelected: Palette.accent,
  },
};

// ─── Typography ───────────────────────────────────────────────────────────────

export const Typography = {
  displayLarge: {
    fontSize: 32,
    fontWeight: '800' as const,
    lineHeight: 38,
    fontFamily: 'Inter_800ExtraBold',
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    fontFamily: 'Inter_700Bold',
  },
  headingMedium: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    fontFamily: 'Inter_700Bold',
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    fontFamily: 'Inter_600SemiBold',
  },
  bodyDefault: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    fontFamily: 'Inter_500Medium',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    fontFamily: 'Inter_400Regular',
  },
  label: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
};

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// ─── Border Radius ────────────────────────────────────────────────────────────

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

// ─── Shadow Presets ───────────────────────────────────────────────────────────

export const Shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  button: {
    shadowColor: Palette.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};

// ─── Fonts (legacy — kept for backward compat) ───────────────────────────────

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter_400Regular',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Inter_400Regular',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

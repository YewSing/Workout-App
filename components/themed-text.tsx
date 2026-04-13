import { StyleSheet, Text, type TextProps } from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Typography, Palette } from '@/constants/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | 'default'
    | 'title'
    | 'defaultSemiBold'
    | 'subtitle'
    | 'link'
    | 'displayLarge'
    | 'displaySmall'
    | 'headingMedium'
    | 'bodyLarge'
    | 'bodyDefault'
    | 'bodySmall'
    | 'caption'
    | 'label';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      style={[
        { color },
        // ── New Design System Types ──
        type === 'displayLarge' ? styles.displayLarge : undefined,
        type === 'displaySmall' ? styles.displaySmall : undefined,
        type === 'headingMedium' ? styles.headingMedium : undefined,
        type === 'bodyLarge' ? styles.bodyLarge : undefined,
        type === 'bodyDefault' ? styles.bodyDefault : undefined,
        type === 'bodySmall' ? styles.bodySmall : undefined,
        type === 'caption' ? styles.caption : undefined,
        type === 'label' ? styles.label : undefined,
        // ── Legacy Types (backward compat) ──
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  // ── New Design System ──
  displayLarge: {
    ...Typography.displayLarge,
  },
  displaySmall: {
    ...Typography.displaySmall,
  },
  headingMedium: {
    ...Typography.headingMedium,
  },
  bodyLarge: {
    ...Typography.bodyLarge,
  },
  bodyDefault: {
    ...Typography.bodyDefault,
  },
  bodySmall: {
    ...Typography.bodySmall,
  },
  caption: {
    ...Typography.caption,
  },
  label: {
    ...Typography.label,
  },
  // ── Legacy Styles (backward compat — migrate away over time) ──
  default: {
    ...Typography.bodyDefault,
  },
  defaultSemiBold: {
    ...Typography.bodyLarge,
  },
  title: {
    ...Typography.displayLarge,
  },
  subtitle: {
    ...Typography.headingMedium,
  },
  link: {
    ...Typography.bodyDefault,
    color: Palette.accent,
  },
});

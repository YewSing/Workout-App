import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  fullWidth = true,
  style,
  textStyle,
  icon,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        sizeStyles[size],
        variantStyles[variant],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isDisabled}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? Palette.accent : Palette.textOnAccent}
        />
      ) : (
        <>
          {icon}
          <ThemedText
            style={[
              styles.baseText,
              sizeTextStyles[size],
              variantTextStyles[variant],
              icon ? { marginLeft: Spacing.sm } : undefined,
              textStyle,
            ]}
          >
            {title}
          </ThemedText>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
  },
  baseText: {
    fontFamily: Typography.bodyLarge.fontFamily,
    fontWeight: '700',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});

const sizeStyles: Record<ButtonSize, ViewStyle> = {
  sm: { height: 36, paddingHorizontal: Spacing.md },
  md: { height: 44, paddingHorizontal: Spacing.lg },
  lg: { height: 52, paddingHorizontal: Spacing.xl },
};

const sizeTextStyles: Record<ButtonSize, TextStyle> = {
  sm: { fontSize: 13 },
  md: { fontSize: 15 },
  lg: { fontSize: 17 },
};

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: {
    backgroundColor: Palette.accent,
    ...Shadows.button,
  },
  secondary: {
    backgroundColor: Palette.surfaceAlt,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Palette.accent,
  },
  danger: {
    backgroundColor: Palette.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
};

const variantTextStyles: Record<ButtonVariant, TextStyle> = {
  primary: { color: Palette.textOnAccent },
  secondary: { color: Palette.textPrimary },
  outline: { color: Palette.accent },
  danger: { color: Palette.textOnAccent },
  ghost: { color: Palette.accent },
};

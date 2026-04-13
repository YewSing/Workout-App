import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

interface AppCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'elevated' | 'flat' | 'outline';
}

export function AppCard({ children, style, onPress, variant = 'elevated' }: AppCardProps) {
  const cardStyle = [
    styles.base,
    variant === 'elevated' && styles.elevated,
    variant === 'flat' && styles.flat,
    variant === 'outline' && styles.outline,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  elevated: {
    ...Shadows.card,
  },
  flat: {
    // No shadow, just surface bg
  },
  outline: {
    borderWidth: 1,
    borderColor: Palette.border,
    backgroundColor: 'transparent',
  },
});

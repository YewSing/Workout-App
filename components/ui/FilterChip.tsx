import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Typography } from '@/constants/theme';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ThemedText
        style={[styles.chipText, selected && styles.chipTextSelected]}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.border,
    marginRight: Spacing.sm,
  },
  chipSelected: {
    backgroundColor: Palette.accent,
    borderColor: Palette.accent,
  },
  chipText: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: Palette.textSecondary,
  },
  chipTextSelected: {
    color: Palette.textOnAccent,
    fontWeight: '600',
  },
});

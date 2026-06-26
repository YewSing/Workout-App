import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Typography } from '@/constants/theme';

interface SegmentedToggleOption {
  value: string;
  label: string;
}

interface SegmentedToggleProps {
  options: SegmentedToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function SegmentedToggle({ options, value, onChange }: SegmentedToggleProps) {
  return (
    <View style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.pill, selected && styles.pillSelected]}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
          >
            <ThemedText style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </ThemedText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.full,
    padding: 3,
  },
  pill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  pillSelected: {
    backgroundColor: Palette.textPrimary,
  },
  label: {
    fontSize: Typography.bodySmall.fontSize,
    fontFamily: Typography.bodySmall.fontFamily,
    color: Palette.textSecondary,
  },
  labelSelected: {
    color: Palette.textOnAccent,
    fontFamily: Typography.bodyLarge.fontFamily,
  },
});

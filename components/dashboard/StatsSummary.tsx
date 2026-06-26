import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';

interface StatItem {
  label: string;
  value: string;
  unit?: string;
}

interface StatsSummaryProps {
  items: StatItem[];
}

export function StatsSummary({ items }: StatsSummaryProps) {
  return (
    <View style={styles.row}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <View style={styles.separator} />}
          <View style={styles.item}>
            <ThemedText type="caption" style={styles.label}>{item.label}</ThemedText>
            <ThemedText type="displaySmall" style={styles.value}>{item.value}</ThemedText>
            <ThemedText type="caption" style={styles.unit}>{item.unit || ' '}</ThemedText>
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  separator: {
    width: 1,
    height: '70%',
    backgroundColor: Palette.border,
  },
  label: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xs,
  },
  value: {
    color: Palette.textPrimary,
  },
  unit: {
    color: Palette.textSecondary,
    marginTop: 2,
  },
});

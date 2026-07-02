import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius } from '@/constants/theme';

const CHART_HEIGHT = 120;
const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export interface DayVolume {
  date: Date;
  volume: number; // kg
  durationMinutes: number;
}

interface WeeklyVolumeChartProps {
  bars: DayVolume[]; // 7 values, Monday -> Sunday
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

function niceCeil(value: number): number {
  if (value <= 0) return 10;
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const fraction = value / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function formatAxisValue(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k` : String(Math.round(value));
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  return `${mins} min`;
}

function formatFullDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

export function WeeklyVolumeChart({ bars, periodLabel, onPrev, onNext, canGoNext }: WeeklyVolumeChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const niceMax = niceCeil(Math.max(...bars.map((b) => b.volume), 1));

  return (
    <View>
      <ThemedText type="bodyLarge" style={styles.title}>Weekly Volume</ThemedText>

      <View style={styles.chartRow}>
        <View style={styles.yAxisWrapper}>
          <ThemedText type="caption" style={styles.yAxisUnit}>kg</ThemedText>
          <View style={styles.yAxis}>
            <ThemedText type="caption" style={styles.yAxisLabel}>{formatAxisValue(niceMax)}</ThemedText>
            <ThemedText type="caption" style={styles.yAxisLabel}>{formatAxisValue(niceMax / 2)}</ThemedText>
            <ThemedText type="caption" style={styles.yAxisLabel}>0</ThemedText>
          </View>
        </View>

        <View style={styles.chartColumn}>
          <View style={styles.plotArea}>
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />

            <View style={styles.barsRow}>
              {bars.map((day, index) => {
                const height = Math.max((day.volume / niceMax) * CHART_HEIGHT, 3);
                const isSelected = selectedIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    style={styles.barColumn}
                    activeOpacity={0.7}
                    onPress={() => setSelectedIndex((prev) => (prev === index ? null : index))}
                  >
                    {isSelected && (
                      <View style={styles.tooltip}>
                        <View style={styles.tooltipValueRow}>
                          <ThemedText type="bodyLarge" style={styles.tooltipValue}>
                            {Math.round(day.volume)}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.tooltipUnit}>kg</ThemedText>
                        </View>
                        <ThemedText type="caption" style={styles.tooltipMeta}>
                          {formatDuration(day.durationMinutes)}
                        </ThemedText>
                        <ThemedText type="caption" style={styles.tooltipMeta}>
                          {formatFullDate(day.date)}
                        </ThemedText>
                        <View style={styles.tooltipPointer} />
                      </View>
                    )}
                    <View
                      style={[
                        styles.bar,
                        {
                          height,
                          backgroundColor: Palette.chartBar,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      <View style={styles.dayLabelsRow}>
        {WEEKDAY_LABELS.map((label, index) => (
          <ThemedText key={index} type="caption" style={styles.dayLabel}>{label}</ThemedText>
        ))}
      </View>

      <View style={styles.pagination}>
        <TouchableOpacity onPress={onPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={18} color={Palette.textPrimary} />
        </TouchableOpacity>
        <ThemedText type="bodySmall" style={styles.periodLabel}>{periodLabel}</ThemedText>
        <TouchableOpacity
          onPress={onNext}
          disabled={!canGoNext}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? Palette.textPrimary : Palette.border} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: {
    color: Palette.textPrimary,
    marginBottom: Spacing.lg,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  yAxisWrapper: {
    width: 35,
    alignItems: 'flex-end',
    paddingRight: Spacing.sm,
  },
  yAxisUnit: {
    color: Palette.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yAxisLabel: {
    color: Palette.textSecondary,
  },
  chartColumn: {
    flex: 1,
  },
  plotArea: {
    height: CHART_HEIGHT,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Palette.gridLine,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 10,
    borderRadius: Radius.sm / 2,
  },
  tooltip: {
    backgroundColor: Palette.textPrimary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    zIndex: 10,
    width: 100
  },
  tooltipValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tooltipValue: {
    color: Palette.surface,
  },
  tooltipUnit: {
    color: Palette.surface,
  },
  tooltipMeta: {
    color: Palette.surface,
    opacity: 0.7,
  },
  tooltipPointer: {
    position: 'absolute',
    bottom: -5,
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Palette.textPrimary,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    marginLeft: 35,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: Palette.textSecondary,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    marginTop: Spacing.lg,
  },
  periodLabel: {
    color: Palette.textPrimary,
    minWidth: 190,
    textAlign: 'center',
  },
});

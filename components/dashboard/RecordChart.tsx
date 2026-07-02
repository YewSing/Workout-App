import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius } from '@/constants/theme';
import { ChartRecord, niceCeil, formatAxisValue, formatDdMm } from '@/utils/chart';

const CHART_HEIGHT = 120;
const DOT_SIZE = 7;
const LINE_THICKNESS = 2;
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatFullDate(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

interface RecordChartProps {
  points: ChartRecord[]; // oldest -> newest, for left-to-right display
  variant: 'bar' | 'line';
  unit: string; // Y-axis / tooltip unit, e.g. 'kg' or 'min'
  title: string;
  headerRight?: React.ReactNode; // right-aligned slot on the title row (e.g. a toggle)
  periodLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canGoPrev: boolean;
  canGoNext: boolean;
}

export function RecordChart({
  points, variant, unit, title, headerRight, periodLabel, onPrev, onNext, canGoPrev, canGoNext,
}: RecordChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [plotWidth, setPlotWidth] = useState(0);

  const niceMax = niceCeil(Math.max(...points.map((p) => p.value), 1));
  const n = points.length;

  const onPlotLayout = (e: LayoutChangeEvent) => setPlotWidth(e.nativeEvent.layout.width);

  // Pixel geometry for the line variant (needs a measured plot width).
  const colWidth = n > 0 ? plotWidth / n : 0;
  const pointX = (i: number) => (i + 0.5) * colWidth;
  const pointY = (value: number) => CHART_HEIGHT - (value / niceMax) * CHART_HEIGHT;

  return (
    <View>
      <View style={styles.titleRow}>
        <ThemedText type="bodyLarge" style={styles.title}>{title}</ThemedText>
        {headerRight}
      </View>

      <View style={styles.chartRow}>
        {/* Unit label sits above the tick labels, outside the space-between ticks container
            so the 3 tick marks still align exactly with the 3 grid lines. */}
        <View style={styles.yAxisWrapper}>
          <ThemedText type="caption" style={styles.yAxisUnit}>{unit}</ThemedText>
          <View style={styles.yAxis}>
            <ThemedText type="caption" style={styles.yAxisLabel}>{formatAxisValue(niceMax)}</ThemedText>
            <ThemedText type="caption" style={styles.yAxisLabel}>{formatAxisValue(niceMax / 2)}</ThemedText>
            <ThemedText type="caption" style={styles.yAxisLabel}>0</ThemedText>
          </View>
        </View>

        <View style={styles.chartColumn}>
          <View style={styles.plotArea} onLayout={onPlotLayout}>
            <View style={[styles.gridLine, { top: 0 }]} />
            <View style={[styles.gridLine, { top: '50%' }]} />
            <View style={[styles.gridLine, { bottom: 0 }]} />

            {/* Line overlay: segments first, then dots on top */}
            {variant === 'line' && plotWidth > 0 && (
              <>
                {points.slice(0, -1).map((p, i) => {
                  const x1 = pointX(i);
                  const y1 = pointY(p.value);
                  const x2 = pointX(i + 1);
                  const y2 = pointY(points[i + 1].value);
                  const length = Math.hypot(x2 - x1, y2 - y1);
                  const angle = Math.atan2(y2 - y1, x2 - x1);
                  return (
                    <View
                      key={`seg-${i}`}
                      style={[
                        styles.lineSegment,
                        {
                          width: length,
                          left: (x1 + x2) / 2 - length / 2,
                          top: (y1 + y2) / 2 - LINE_THICKNESS / 2,
                          transform: [{ rotate: `${angle}rad` }],
                        },
                      ]}
                    />
                  );
                })}
                {points.map((p, i) => (
                  <View
                    key={`dot-${i}`}
                    style={[styles.dot, { left: pointX(i) - DOT_SIZE / 2, top: pointY(p.value) - DOT_SIZE / 2 }]}
                  />
                ))}
              </>
            )}

            {/* Interactive columns (bars for bar variant, hit targets for line variant) */}
            <View style={styles.columnsRow}>
              {points.map((p, i) => {
                const height = Math.max((p.value / niceMax) * CHART_HEIGHT, 3);
                const isSelected = selectedIndex === i;
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.column}
                    activeOpacity={0.7}
                    onPress={() => setSelectedIndex((prev) => (prev === i ? null : i))}
                  >
                    {isSelected && (
                      <View style={styles.tooltip}>
                        <View style={styles.tooltipValueRow}>
                          <ThemedText type="bodyLarge" style={styles.tooltipValue}>
                            {Math.round(p.value)}
                          </ThemedText>
                          <ThemedText type="caption" style={styles.tooltipUnit}>{unit}</ThemedText>
                        </View>
                        {p.subtitle && (
                          <ThemedText type="caption" style={styles.tooltipMeta}>{p.subtitle}</ThemedText>
                        )}
                        <ThemedText type="caption" style={styles.tooltipMeta}>
                          {formatFullDate(p.date)}
                        </ThemedText>
                        <View style={styles.tooltipPointer} />
                      </View>
                    )}
                    {variant === 'bar' && (
                      <View style={[styles.bar, { height, backgroundColor: Palette.chartBar }]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </View>

      {/* Date labels sit below the plot, indented to clear the y-axis column. */}
      <View style={styles.dayLabelsRow}>
        {points.map((p, i) => (
          <ThemedText key={i} type="caption" style={styles.dayLabel}>{formatDdMm(p.date)}</ThemedText>
        ))}
      </View>

      <View style={styles.pagination}>
        <TouchableOpacity onPress={onPrev} disabled={!canGoPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={18} color={canGoPrev ? Palette.textPrimary : Palette.border} />
        </TouchableOpacity>
        <ThemedText type="bodySmall" style={styles.periodLabel}>{periodLabel}</ThemedText>
        <TouchableOpacity onPress={onNext} disabled={!canGoNext} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-forward" size={18} color={canGoNext ? Palette.textPrimary : Palette.border} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  title: {
    color: Palette.textPrimary,
    flexShrink: 1,
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
  yAxis: {
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  yAxisUnit: {
    color: Palette.accent,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
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
  lineSegment: {
    position: 'absolute',
    height: LINE_THICKNESS,
    borderRadius: LINE_THICKNESS / 2,
    backgroundColor: Palette.accent,
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Palette.accent,
  },
  columnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
  },
  column: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
    height: CHART_HEIGHT,
  },
  bar: {
    width: 14,
    borderRadius: Radius.sm / 2,
  },
  tooltip: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    backgroundColor: Palette.textPrimary,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
    zIndex: 10,
    width: 115,
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
    marginLeft: 35, // matches yAxisWrapper width so labels sit under the plot, not the axis
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
    minWidth: 140,
    textAlign: 'center',
  },
});

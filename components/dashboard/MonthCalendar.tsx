import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius } from '@/constants/theme';

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthCalendarProps {
  year: number;
  month: number; // 0-indexed
  trainedDates: Set<string>; // 'yyyy-mm-dd'
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function buildMonthMatrix(year: number, month: number): (number | null)[][] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

  const matrix: (number | null)[][] = [];
  let week: (number | null)[] = new Array(firstWeekday).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    week.push(day);
    if (week.length === 7) {
      matrix.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    matrix.push(week);
  }
  return matrix;
}

export function MonthCalendar({ year, month, trainedDates, onPrev, onNext, canGoNext }: MonthCalendarProps) {
  const matrix = buildMonthMatrix(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const headerLabel = `${MONTH_NAMES[month]} ${year}`;

  return (
    <View>
      <ThemedText type="bodyLarge" style={styles.title}>{headerLabel}</ThemedText>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <ThemedText key={label} type="caption" style={styles.weekdayLabel}>{label}</ThemedText>
        ))}
      </View>

      {matrix.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.cell} />;
            }
            const isTrained = trainedDates.has(toDateKey(year, month, day));
            const isToday = isCurrentMonth && today.getDate() === day;
            return (
              <View key={dayIndex} style={styles.cell}>
                <View style={[styles.dayCircle, isTrained && styles.dayCircleTrained, isToday && !isTrained && styles.dayCircleToday]}>
                  <ThemedText style={[styles.dayNumber, isTrained && styles.dayNumberTrained]}>
                    {day}
                  </ThemedText>
                  {isTrained && (
                    <View style={styles.checkBadge}>
                      <Ionicons name="checkmark" size={9} color={Palette.success} />
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      ))}

      <View style={styles.pagination}>
        <TouchableOpacity onPress={onPrev} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={18} color={Palette.textPrimary} />
        </TouchableOpacity>
        <ThemedText type="bodySmall" style={styles.periodLabel}>{headerLabel}</ThemedText>
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
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    color: Palette.textSecondary,
  },
  weekRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: '78%',
    aspectRatio: 1,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleTrained: {
    backgroundColor: Palette.success,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: Palette.accent,
  },
  dayNumber: {
    fontSize: 13,
    color: Palette.textPrimary,
  },
  dayNumberTrained: {
    color: Palette.textOnAccent,
    fontWeight: '600',
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    alignItems: 'center',
    justifyContent: 'center',
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
    minWidth: 130,
    textAlign: 'center',
  },
});

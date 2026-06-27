import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { fetchWorkouts, deleteWorkoutTemplate } from '@/api/workout';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { WeeklyVolumeChart } from '@/components/dashboard/WeeklyVolumeChart';
import { MonthCalendar } from '@/components/dashboard/MonthCalendar';
import { StatsSummary } from '@/components/dashboard/StatsSummary';

const { width } = Dimensions.get('window');

interface SessionSummary {
  sessionId: number;
  dateTime: string;
  duration: string;
  volume: number;
}

const unwrap = (v: any): any[] => (v && v.$values ? v.$values : Array.isArray(v) ? v : []);

function durationToMinutes(duration: string | null | undefined): number {
  if (!duration) return 0;
  const parts = duration.split(':');
  if (parts.length < 2) return 0;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

function startOfWeek(offsetWeeks: number): Date {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday of current week
  const monday = new Date(now);
  monday.setDate(diff + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateDdMmYyyy(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function formatVolume(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(Math.round(value));
}

function computeWeekData(allSessions: SessionSummary[], weekOffset: number) {
  const weekStart = startOfWeek(weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const bars: { date: Date; volume: number; durationMinutes: number }[] = [];
  const daySessions: SessionSummary[][] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(day.getDate() + i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const sessionsForDay = allSessions.filter(s => { const d = new Date(s.dateTime); return d >= day && d < next; });
    daySessions.push(sessionsForDay);
    bars.push({
      date: day,
      volume: sessionsForDay.reduce((sum, s) => sum + (s.volume || 0), 0),
      durationMinutes: sessionsForDay.reduce((sum, s) => sum + durationToMinutes(s.duration), 0),
    });
  }

  const weekSessions = daySessions.flat();
  const sessionCount = weekSessions.length;
  const totalVolume = weekSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
  const avgMinutes = sessionCount > 0
    ? Math.round(weekSessions.reduce((sum, s) => sum + durationToMinutes(s.duration), 0) / sessionCount)
    : 0;

  let periodLabel: string;
  if (weekOffset === 0) {
    periodLabel = 'This Week';
  } else {
    const weekEndInclusive = new Date(weekEnd);
    weekEndInclusive.setDate(weekEndInclusive.getDate() - 1);
    periodLabel = `${formatDateDdMmYyyy(weekStart)} – ${formatDateDdMmYyyy(weekEndInclusive)}`;
  }

  return { bars, sessionCount, totalVolume, avgMinutes, periodLabel, canGoNext: weekOffset < 0 };
}

function computeMonthData(allSessions: SessionSummary[], monthOffset: number) {
  const base = new Date();
  base.setDate(1);
  base.setHours(0, 0, 0, 0);
  base.setMonth(base.getMonth() + monthOffset);
  const year = base.getFullYear();
  const month = base.getMonth();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const monthSessions = allSessions.filter(s => { const d = new Date(s.dateTime); return d >= monthStart && d < monthEnd; });
  const trainedDates = new Set<string>(
    monthSessions.map(s => {
      const d = new Date(s.dateTime);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })
  );

  const sessionCount = monthSessions.length;
  const totalVolume = monthSessions.reduce((sum, s) => sum + (s.volume || 0), 0);
  const avgMinutes = sessionCount > 0
    ? Math.round(monthSessions.reduce((sum, s) => sum + durationToMinutes(s.duration), 0) / sessionCount)
    : 0;

  return { year, month, trainedDates, sessionCount, totalVolume, avgMinutes, canGoNext: monthOffset < 0 };
}

export default function HomeScreen() {
  const router = useRouter();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<SessionSummary[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'chart' | 'calendar'>('chart');
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthOffset, setMonthOffset] = useState(0);

  const loadWorkouts = async () => {
    try {
      const data = await fetchWorkouts();
      const list: any[] = data && data.$values ? data.$values : Array.isArray(data) ? data : [];
      setWorkouts(list);

      // Collect all sessions from all variations across all workouts
      const collectedSessions: SessionSummary[] = [];
      for (const w of list) {
        for (const v of unwrap(w.variations)) {
          for (const s of unwrap(v.sessions)) {
            collectedSessions.push(s);
          }
        }
      }
      setAllSessions(collectedSessions);
    } catch (err) {
      console.log("Error loading workouts", err);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const weekData = useMemo(() => computeWeekData(allSessions, weekOffset), [allSessions, weekOffset]);
  const monthData = useMemo(() => computeMonthData(allSessions, monthOffset), [allSessions, monthOffset]);
  const activeStats = viewMode === 'chart' ? weekData : monthData;

  const handleMoreActions = (id: string) => {
    setSelectedWorkoutId(id);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedWorkoutId) return;

    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkoutTemplate(selectedWorkoutId);
              setModalVisible(false);
              loadWorkouts();
            } catch {
              Alert.alert("Error", "Could not delete template");
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header Section ── */}
        <View style={styles.header}>
          <View>
            <ThemedText type="displayLarge" style={styles.greeting}>Dashboard</ThemedText>
            <ThemedText type="bodySmall" style={styles.subtitle}>Tracking your progress</ThemedText>
          </View>
          <SegmentedToggle
            options={[
              { value: 'chart', label: 'Chart' },
              { value: 'calendar', label: 'Calendar' },
            ]}
            value={viewMode}
            onChange={(v) => setViewMode(v as 'chart' | 'calendar')}
          />
        </View>

        {/* ── Activity Card (chart or calendar + stats) ── */}
        <View style={styles.dashboardCard}>
          {viewMode === 'chart' ? (
            <WeeklyVolumeChart
              bars={weekData.bars}
              periodLabel={weekData.periodLabel}
              onPrev={() => setWeekOffset(o => o - 1)}
              onNext={() => setWeekOffset(o => Math.min(o + 1, 0))}
              canGoNext={weekData.canGoNext}
            />
          ) : (
            <MonthCalendar
              year={monthData.year}
              month={monthData.month}
              trainedDates={monthData.trainedDates}
              onPrev={() => setMonthOffset(o => o - 1)}
              onNext={() => setMonthOffset(o => Math.min(o + 1, 0))}
              canGoNext={monthData.canGoNext}
            />
          )}

          <View style={styles.cardDivider} />

          <StatsSummary
            items={[
              { label: 'Sessions', value: String(activeStats.sessionCount) },
              { label: 'Total Volume', value: formatVolume(activeStats.totalVolume), unit: 'kg' },
              { label: 'Avg Duration', value: activeStats.avgMinutes ? String(activeStats.avgMinutes) : '—', unit: 'min' },
            ]}
          />
        </View>

        {/* ── My Workout Plans Section ── */}
        <View style={styles.sectionHeader}>
          <ThemedText type="headingMedium">My Workout Plans</ThemedText>
          <View style={styles.sectionActions}>
            <TouchableOpacity 
              onPress={() => router.push('/workout/new-template')}
              style={styles.addButton}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color={Palette.textOnAccent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/workout')}>
              <ThemedText type="bodySmall" style={{ color: Palette.accent }}>View All</ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Template Cards Grid ── */}
        {workouts.length === 0 ? (
          <ThemedText type="bodySmall" style={styles.emptyText}>No plan yet. Tap + to create one.</ThemedText>
        ) : (
        <View style={styles.cardGrid}>
          {workouts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.templateCard}
              onPress={() => router.push(`/workout/${item.id}`)}
              activeOpacity={0.8}
            >
              {/* Top row: icon + more button */}
              <View style={styles.cardTopRow}>
                <View style={styles.iconCircle}>
                  <IconSymbol name="dumbbell.fill" size={20} color={Palette.accent} />
                </View>
                <TouchableOpacity 
                  style={styles.moreActionButton}
                  onPress={() => handleMoreActions(item.id)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Ionicons name="ellipsis-horizontal" size={18} color={Palette.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Card content */}
              <ThemedText type="bodyLarge" numberOfLines={1} style={styles.cardTitle}>
                {item.name}
              </ThemedText>
              <ThemedText type="caption" numberOfLines={2} style={styles.cardDesc}>
                {item.description || 'No description'}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </View>
        )}

      </ScrollView>

      {/* ── Action Bottom Sheet Modal ── */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.dragIndicator} />
            <ThemedText type="bodySmall" style={styles.sheetTitle}>Template Actions</ThemedText>

            <TouchableOpacity style={styles.actionItem} onPress={() => {
                setModalVisible(false);
                if (selectedWorkoutId) router.push(`/workout/${selectedWorkoutId}`);
            }}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="create-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault" style={styles.actionText}>Edit Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Duplicate template feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="copy-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault" style={styles.actionText}>Duplicate Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Pin to Top feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="star-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault" style={styles.actionText}>Pin to Top</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Share feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="share-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault" style={styles.actionText}>Share Template</ThemedText>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
              <View style={[styles.actionIconCircle, { backgroundColor: Palette.dangerLight }]}>
                <Ionicons name="trash-outline" size={20} color={Palette.danger} />
              </View>
              <ThemedText type="bodyDefault" style={{ color: Palette.danger }}>Delete Template</ThemedText>
            </TouchableOpacity>
            
          </View>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: 64,
    paddingBottom: Spacing.xxxl,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: {
    color: Palette.textPrimary,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },

  // ── Dashboard Card (chart/calendar + stats) ──
  dashboardCard: {
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    paddingBottom:Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xxl,
    ...Shadows.card,
  },
  cardDivider: {
    height: 1,
    backgroundColor: Palette.border,
    marginHorizontal: Spacing.sm,
    marginVertical: Spacing.lg,
  },

  // ── Section Header ──
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionActions: {
    flexDirection: 'row', 
    alignItems: 'center',
    gap: Spacing.md,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: Palette.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Template Cards ──
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  templateCard: {
    width: (width - Spacing.xl * 2 - Spacing.md) / 2,
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  cardTopRow: {
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: Spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreActionButton: {
    padding: Spacing.xs,
  },
  cardTitle: {
    color: Palette.textPrimary,
    marginBottom: Spacing.xs,
  },
  cardDesc: {
    color: Palette.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    marginTop: Spacing.lg,
  },

  // ── Bottom Sheet Modal ──
  modalOverlay: {
    flex: 1, 
    backgroundColor: Palette.overlay, 
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: Palette.surface, 
    borderTopLeftRadius: Radius.xl, 
    borderTopRightRadius: Radius.xl, 
    padding: Spacing.xl, 
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40, 
    height: 5, 
    backgroundColor: Palette.border, 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginBottom: Spacing.xl,
  },
  sheetTitle: {
    color: Palette.textSecondary, 
    marginBottom: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md, 
    gap: Spacing.md,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: Palette.textPrimary,
  },
  divider: {
    height: 1, 
    backgroundColor: Palette.border, 
    marginVertical: Spacing.sm,
  },
});
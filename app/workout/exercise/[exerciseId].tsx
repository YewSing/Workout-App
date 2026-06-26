import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Image , TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { fetchExerciseHistory } from '@/api/workout';

interface SetSummary { weight: number; reps: number; }
interface ExerciseSession { dateTime: string; maxWeight: number; volume: number; sets: SetSummary[]; }
interface PR { bestWeight: number; bestReps: number; achivedDate: string; }
interface ExerciseHistory {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  photoUrl?: string;
  pr?: PR;
  sessions: ExerciseSession[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳'];
const circledNumber = (n: number) => CIRCLED_NUMBERS[n - 1] ?? `(${n})`;

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<ExerciseHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    fetchExerciseHistory(exerciseId as string)
      .then(d => { if (active) setData(d); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [exerciseId]));

  const chartSessions = data?.sessions.slice(0, 7).reverse() ?? [];
  const maxWeight = chartSessions.length > 0 ? Math.max(...chartSessions.map(s => s.maxWeight)) || 1 : 1;

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={Palette.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="headingMedium" numberOfLines={1}>{data?.name ?? '…'}</ThemedText>
          {data?.muscleGroup && (
            <View style={styles.muscleTag}>
              <ThemedText type="caption" style={styles.muscleTagText}>{data.muscleGroup}</ThemedText>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Palette.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Photo */}
          {data?.photoUrl && (
            <Image source={{ uri: data.photoUrl }} style={styles.photo} resizeMode="cover" />
          )}

          {/* PR Card */}
          <View style={styles.prCard}>
            <View style={styles.prIcon}>
              <ThemedText style={{ fontSize: 22 }}>🏆</ThemedText>
            </View>
            <View style={{ flex: 1 }}>
              <ThemedText type="label" style={styles.prLabel}>PERSONAL RECORD</ThemedText>
              {data?.pr ? (
                <>
                  <ThemedText style={styles.prValue}>
                    {data.pr.bestWeight} kg × {data.pr.bestReps} reps
                  </ThemedText>
                  <ThemedText type="caption" style={styles.prDate}>
                    {formatDate(data.pr.achivedDate)}
                  </ThemedText>
                </>
              ) : (
                <ThemedText type="bodySmall" style={{ color: Palette.textSecondary, marginTop: 2 }}>
                  No PR yet — log a set to start tracking!
                </ThemedText>
              )}
            </View>
          </View>

          {/* Progress Chart */}
          <View style={styles.section}>
            <ThemedText type="bodyLarge" style={styles.sectionTitle}>Max Weight Progress</ThemedText>
            {chartSessions.length === 0 ? (
              <ThemedText type="bodySmall" style={styles.emptyText}>No sessions recorded yet.</ThemedText>
            ) : (
              <View style={styles.chartContainer}>
                {chartSessions.map((s, idx) => {
                  const barH = Math.max(8, (s.maxWeight / maxWeight) * 80);
                  return (
                    <View key={idx} style={styles.chartBarContainer}>
                      <ThemedText type="caption" style={styles.chartWeightLabel}>
                        {s.maxWeight > 0 ? `${s.maxWeight}` : ''}
                      </ThemedText>
                      <View style={[styles.chartBar, { height: barH }]} />
                      <ThemedText type="caption" style={styles.chartDateLabel}>
                        {formatShortDate(s.dateTime)}
                      </ThemedText>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Session History */}
          <View style={styles.section}>
            <ThemedText type="bodyLarge" style={styles.sectionTitle}>Session History</ThemedText>
            {(data?.sessions ?? []).length === 0 ? (
              <ThemedText type="bodySmall" style={styles.emptyText}>No sessions recorded yet.</ThemedText>
            ) : (
              data!.sessions.map((s, idx) => (
                <View key={idx} style={styles.sessionRow}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="bodyDefault" style={styles.sessionDate}>{formatDate(s.dateTime)}</ThemedText>
                    <View style={styles.setsRow}>
                      {s.sets.map((set, setIdx) => (
                        <View key={setIdx} style={styles.setChip}>
                          <ThemedText style={styles.setChipNumber}>{circledNumber(setIdx + 1)}</ThemedText>
                          <ThemedText style={styles.setChipText}>{set.weight}kg × {set.reps}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.sessionVolume}>
                    <ThemedText type="bodySmall" style={styles.sessionVolumeText}>
                      {s.volume > 0 ? `${s.volume.toLocaleString()} kg` : '—'}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: Palette.textSecondary }}>Volume</ThemedText>
                  </View>
                </View>
              ))
            )}
          </View>

        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.sm,
    backgroundColor: Palette.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  muscleTag: {
    marginTop: 2,
    alignSelf: 'flex-start',
    backgroundColor: Palette.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  muscleTagText: {
    color: Palette.accent,
    fontWeight: '600',
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 48,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: Radius.xl,
    marginBottom: Spacing.lg,
  },
  prCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  prIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(245,166,35,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prLabel: {
    color: Palette.textSecondary,
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Palette.textPrimary,
  },
  prDate: {
    color: Palette.textSecondary,
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: 4,
    ...Shadows.card,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  chartWeightLabel: {
    fontSize: 9,
    color: Palette.textSecondary,
  },
  chartBar: {
    width: '60%',
    borderRadius: Radius.sm,
    backgroundColor: Palette.accent,
  },
  chartDateLabel: {
    fontSize: 9,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  sessionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: 6,
    ...Shadows.card,
  },
  sessionDate: {
    marginBottom: Spacing.sm,
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  setChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  setChipNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: Palette.textSecondary,
  },
  setChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Palette.textPrimary,
  },
  sessionVolume: {
    alignItems: 'flex-end',
    paddingTop: 2,
  },
  sessionVolumeText: {
    fontWeight: '700',
    color: Palette.accent,
  },
  emptyText: {
    color: Palette.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});

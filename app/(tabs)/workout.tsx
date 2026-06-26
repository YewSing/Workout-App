import React, { useState, useMemo , useCallback } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { FilterChip } from '@/components/ui/FilterChip';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { fetchAllExercises } from '@/api/workout';

const muscleGroupsMapping: Record<string, string[]> = {
  'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
  'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
  'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids', 'shoulders'],
  'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes'],
  'Biceps': ['biceps', 'bicep'],
  'Triceps': ['triceps', 'tricep'],
  'Core': ['core', 'abs', 'abdominals', 'obliques'],
};

interface PR {
  bestWeight: number;
  bestReps: number;
}

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
  pr?: PR;
}

const MUSCLE_ORDER = ['Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Core'];

export default function WorkoutScreen() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const loadExercises = useCallback(async () => {
    try {
      const data = await fetchAllExercises();
      const arr: Exercise[] = Array.isArray(data) ? data : (data?.$values ?? []);
      setExercises(arr);
    } catch {}
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    loadExercises();
  }, [loadExercises]));

  const grouped = useMemo(() => {
    const filtered = selectedMuscle
      ? exercises.filter(ex => {
          const m = (ex.muscleGroup || '').toLowerCase();
          const targets = muscleGroupsMapping[selectedMuscle] || [selectedMuscle.toLowerCase()];
          return targets.some(t => m.includes(t)) || m === selectedMuscle.toLowerCase();
        })
      : exercises;
    const map: Record<string, Exercise[]> = {};
    filtered.forEach(ex => {
      const group = ex.muscleGroup || 'Other';
      if (!map[group]) map[group] = [];
      map[group].push(ex);
    });
    const ordered: { group: string; items: Exercise[] }[] = [];
    MUSCLE_ORDER.forEach(g => { if (map[g]) ordered.push({ group: g, items: map[g] }); });
    Object.keys(map).forEach(g => { if (!MUSCLE_ORDER.includes(g)) ordered.push({ group: g, items: map[g] }); });
    return ordered;
  }, [exercises, selectedMuscle]);

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.header}>
          <ThemedText type="displayLarge">Exercises</ThemedText>
          <ThemedText type="bodySmall" style={styles.subtitle}>Browse & track your lifts</ThemedText>
        </View>

        {/* New Exercise action card */}
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => router.push('/workout/new-exercise' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="add-circle-outline" size={24} color={Palette.accent} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="bodyLarge">New Exercise</ThemedText>
            <ThemedText type="caption" style={styles.cardSubtext}>Create a custom exercise</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Palette.textSecondary} />
        </TouchableOpacity>

        {/* Muscle group filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <FilterChip label="All" selected={selectedMuscle === null} onPress={() => setSelectedMuscle(null)} />
          {['Chest', 'Back', 'Shoulder', 'Legs', 'Biceps', 'Triceps', 'Core'].map(muscle => (
            <FilterChip
              key={muscle}
              label={muscle}
              selected={selectedMuscle === muscle}
              onPress={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
            />
          ))}
        </ScrollView>

        {/* Exercise list */}
        {loading ? (
          <ActivityIndicator size="large" color={Palette.accent} style={{ marginTop: Spacing.xxl }} />
        ) : exercises.length === 0 ? (
          <ThemedText type="bodySmall" style={styles.emptyText}>No exercises yet. Create one above.</ThemedText>
        ) : (
          grouped.map(({ group, items }) => (
            <View key={group} style={styles.section}>
              <View style={styles.sectionHeader}>
                <ThemedText type="label" style={styles.sectionLabel}>{group.toUpperCase()}</ThemedText>
                <View style={styles.sectionDivider} />
              </View>
              {items.map(ex => (
                <TouchableOpacity
                  key={ex.id}
                  style={styles.exerciseCard}
                  onPress={() => router.push(`/workout/exercise/${ex.id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.exerciseInfo}>
                    <ThemedText type="bodyLarge">{ex.name}</ThemedText>
                    <View style={styles.metaRow}>
                      <ThemedText type="caption" style={styles.muscleTag}>{ex.muscleGroup}</ThemedText>
                      {ex.pr && (
                        <View style={styles.prBadge}>
                          <ThemedText style={styles.prBadgeText}>🏆 {ex.pr.bestWeight}kg ×{ex.pr.bestReps}</ThemedText>
                        </View>
                      )}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Palette.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          ))
        )}

      </ScrollView>
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
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Palette.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardSubtext: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Palette.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  sectionDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Palette.border,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 6,
    ...Shadows.card,
  },
  exerciseInfo: {
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  muscleTag: {
    color: Palette.textSecondary,
  },
  prBadge: {
    backgroundColor: 'rgba(245,166,35,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  prBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#C8860A',
  },
  filterRow: {
    marginBottom: Spacing.xl,
  },
  emptyText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    marginTop: Spacing.xxl,
  },
});

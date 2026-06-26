import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert , TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getSessionDetails, SessionDetails } from '@/api/session';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return '—';
  // duration is "hh:mm:ss" from the backend
  const parts = duration.split(':');
  if (parts.length < 2) return duration;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function SessionDetail() {
  const { sessionId } = useLocalSearchParams();
  const router = useRouter();

  const [session, setSession] = useState<SessionDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getSessionDetails(sessionId as string);
        setSession(data);
      } catch {
        Alert.alert('Error', 'Could not load session details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={Palette.accent} />
        </View>
      ) : !session ? (
        <View style={styles.loadingCenter}>
          <ThemedText type="bodyDefault" style={{ color: Palette.textSecondary }}>Session not found.</ThemedText>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
            </TouchableOpacity>
            <ThemedText type="headingMedium" style={styles.title}>Session Details</ThemedText>
          </View>

          <ThemedText type="bodySmall" style={styles.dateText}>{formatDate(session.dateTime)}</ThemedText>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="time-outline" size={20} color={Palette.accent} />
              <ThemedText type="displaySmall" style={styles.statValue}>{formatDuration(session.duration)}</ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>Duration</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="bar-chart-outline" size={20} color={Palette.accent} />
              <ThemedText type="displaySmall" style={styles.statValue}>{Math.round(session.totalVolume)}</ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>kg Volume</ThemedText>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="barbell-outline" size={20} color={Palette.accent} />
              <ThemedText type="displaySmall" style={styles.statValue}>{session.exercises.length}</ThemedText>
              <ThemedText type="caption" style={styles.statLabel}>Exercises</ThemedText>
            </View>
          </View>

          {/* Exercise Cards */}
          <ThemedText type="bodyLarge" style={styles.sectionTitle}>Exercises</ThemedText>
          {session.exercises.map((ex, exIdx) => (
            <View key={exIdx} style={styles.exerciseCard}>
              <ThemedText type="bodyLarge" style={styles.exerciseName}>{ex.name}</ThemedText>
              {ex.note ? (
                <ThemedText type="caption" style={styles.note}>{ex.note}</ThemedText>
              ) : null}

              {/* Set header */}
              <View style={styles.setHeader}>
                <ThemedText type="caption" style={[styles.setCol, styles.setHeaderText]}>SET</ThemedText>
                <ThemedText type="caption" style={[styles.setColMid, styles.setHeaderText]}>WEIGHT</ThemedText>
                <ThemedText type="caption" style={[styles.setColMid, styles.setHeaderText]}>REPS</ThemedText>
                <ThemedText type="caption" style={[styles.setColMid, styles.setHeaderText]}>VOLUME</ThemedText>
              </View>

              {ex.sets.map((set, sIdx) => (
                <View key={sIdx} style={[styles.setRow, sIdx % 2 === 1 && styles.setRowAlt]}>
                  <ThemedText type="bodySmall" style={styles.setCol}>{sIdx + 1}</ThemedText>
                  <ThemedText type="bodySmall" style={styles.setColMid}>{set.weight} kg</ThemedText>
                  <ThemedText type="bodySmall" style={styles.setColMid}>{set.reps}</ThemedText>
                  <ThemedText type="bodySmall" style={[styles.setColMid, { color: Palette.accent }]}>
                    {Math.round(set.weight * set.reps)} kg
                  </ThemedText>
                </View>
              ))}
            </View>
          ))}
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
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: 48,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  title: {
    flex: 1,
    color: Palette.textPrimary,
  },
  dateText: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xl,
    marginLeft: 48,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.card,
  },
  statValue: {
    color: Palette.textPrimary,
  },
  statLabel: {
    color: Palette.textSecondary,
  },
  sectionTitle: {
    marginBottom: Spacing.lg,
    color: Palette.textPrimary,
  },
  exerciseCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  exerciseName: {
    marginBottom: Spacing.xs,
    color: Palette.textPrimary,
  },
  note: {
    color: Palette.textSecondary,
    marginBottom: Spacing.md,
    fontStyle: 'italic',
  },
  setHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  setHeaderText: {
    color: Palette.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  setRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
  },
  setRowAlt: {
    backgroundColor: Palette.surfaceAlt,
  },
  setCol: {
    width: 36,
    color: Palette.textSecondary,
    textAlign: 'center',
  },
  setColMid: {
    flex: 1,
    textAlign: 'center',
    color: Palette.textPrimary,
  },
});

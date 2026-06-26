import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchWorkoutById } from '@/api/workout';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

interface SessionRow {
  sessionId: number;
  dateTime: string;
  duration: string;
  volume: number;
  gymName: string;
}

const unwrap = (v: any): any[] => (v && v.$values ? v.$values : Array.isArray(v) ? v : []);

function formatDuration(duration: string | null | undefined): string {
  if (!duration) return '—';
  const parts = duration.split(':');
  if (parts.length < 2) return duration;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function AllSessions() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchWorkoutById(id as string);
        const rows: SessionRow[] = [];
        for (const v of unwrap(data.variations)) {
          for (const s of unwrap(v.sessions)) {
            rows.push({
              sessionId: s.sessionId,
              dateTime: s.dateTime,
              duration: s.duration,
              volume: s.volume,
              gymName: v.name,
            });
          }
        }
        rows.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
        setSessions(rows);
      } catch {
        Alert.alert('Error', 'Could not load sessions.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
        </TouchableOpacity>
        <ThemedText type="headingMedium">All Sessions</ThemedText>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Palette.accent} />
        </View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="calendar-outline" size={48} color={Palette.border} />
          <ThemedText type="bodyDefault" style={styles.emptyText}>No sessions yet.</ThemedText>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => String(item.sessionId)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const date = new Date(item.dateTime);
            const dateLabel = date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
            const yearLabel = date.getFullYear();
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => router.push(`/workout/${id}/session/${item.sessionId}`)}
              >
                <View style={styles.cardLeft}>
                  <ThemedText type="bodyLarge">{dateLabel}</ThemedText>
                  <ThemedText type="caption" style={styles.yearText}>{yearLabel}</ThemedText>
                  <View style={styles.gymBadge}>
                    <Ionicons name="location-outline" size={12} color={Palette.accent} />
                    <ThemedText type="caption" style={styles.gymText}>{item.gymName}</ThemedText>
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <View style={styles.stat}>
                    <Ionicons name="bar-chart-outline" size={14} color={Palette.accent} />
                    <ThemedText type="bodySmall" style={styles.statText}>{Math.round(item.volume)} kg</ThemedText>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="time-outline" size={14} color={Palette.textSecondary} />
                    <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{formatDuration(item.duration)}</ThemedText>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Palette.border} />
              </TouchableOpacity>
            );
          }}
        />
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.lg,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: {
    color: Palette.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadows.card,
  },
  cardLeft: {
    flex: 1,
    gap: Spacing.xs,
  },
  yearText: {
    color: Palette.textSecondary,
  },
  gymBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gymText: {
    color: Palette.accent,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    color: Palette.accent,
  },
});

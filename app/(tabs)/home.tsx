import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { fetchWorkouts, deleteWorkoutTemplate } from '@/api/workout';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const loadWorkouts = async () => {
    try {
      const data = await fetchWorkouts();
      if (data && data.$values) {
        setWorkouts(data.$values);
      } else if (Array.isArray(data)) {
        setWorkouts(data);
      }
    } catch (err) {
      console.log("Error loading workouts", err);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

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
            } catch (err) {
              Alert.alert("Error", "Could not delete template");
            }
          }
        }
      ]
    );
  };

  // Graph data
  const graphData = [40, 70, 45, 90, 65, 80, 100];
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const maxGraphHeight = 100;
  const maxValue = Math.max(...graphData);

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header Section ── */}
        <View style={styles.header}>
          <ThemedText type="displayLarge" style={styles.greeting}>Dashboard</ThemedText>
          <ThemedText type="bodySmall" style={styles.subtitle}>Tracking your progress</ThemedText>
        </View>

        {/* ── Weekly Volume Card ── */}
        <View style={styles.analyticsCard}>
          <View style={styles.cardHeader}>
            <ThemedText type="bodyLarge">Weekly Volume</ThemedText>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={14} color={Palette.accent} />
              <ThemedText type="caption" style={{ color: Palette.accent, marginLeft: 4 }}>
                +12%
              </ThemedText>
            </View>
          </View>

          {/* Graph bars */}
          <View style={styles.graphContainer}>
            {graphData.map((value, index) => {
              const barHeight = (value / maxValue) * maxGraphHeight;
              // Highlight the tallest bar with accent
              const isHighest = value === maxValue;
              return (
                <View key={index} style={styles.graphBarContainer}>
                  <View
                    style={[
                      styles.graphBar,
                      {
                        height: barHeight,
                        backgroundColor: isHighest ? Palette.accent : Palette.border,
                      },
                    ]}
                  />
                  <ThemedText type="caption" style={styles.graphLabel}>
                    {dayLabels[index]}
                  </ThemedText>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Quick Stats Row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <ThemedText type="caption" style={styles.statLabel}>This Week</ThemedText>
            <ThemedText type="displaySmall" style={styles.statValue}>5</ThemedText>
            <ThemedText type="caption" style={styles.statUnit}>Sessions</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText type="caption" style={styles.statLabel}>Total Volume</ThemedText>
            <ThemedText type="displaySmall" style={styles.statValue}>12.4k</ThemedText>
            <ThemedText type="caption" style={styles.statUnit}>kg</ThemedText>
          </View>
          <View style={styles.statCard}>
            <ThemedText type="caption" style={styles.statLabel}>Avg Duration</ThemedText>
            <ThemedText type="displaySmall" style={styles.statValue}>58</ThemedText>
            <ThemedText type="caption" style={styles.statUnit}>min</ThemedText>
          </View>
        </View>

        {/* ── My Templates Section ── */}
        <View style={styles.sectionHeader}>
          <ThemedText type="headingMedium">My Templates</ThemedText>
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
                  <IconSymbol name="fitness.center" size={20} color={Palette.accent} />
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
    marginBottom: Spacing.xl,
  },
  greeting: {
    color: Palette.textPrimary,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },

  // ── Analytics Card ──
  analyticsCard: {
    backgroundColor: Palette.surface,
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.accentLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: Spacing.md,
  },
  graphBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 10,
    borderRadius: 5,
    marginBottom: Spacing.sm,
  },
  graphLabel: {
    color: Palette.textSecondary,
  },

  // ── Stats Row ──
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
    ...Shadows.card,
  },
  statLabel: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xs,
  },
  statValue: {
    color: Palette.textPrimary,
  },
  statUnit: {
    color: Palette.textSecondary,
    marginTop: 2,
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
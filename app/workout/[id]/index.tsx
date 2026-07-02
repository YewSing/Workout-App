import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, ActivityIndicator, ScrollView, Modal, Platform, UIManager, LayoutAnimation, FlatList } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchWorkoutById, updateWorkoutTemplate, fetchAllExercises, deleteWorkoutTemplate, updateVariation, deleteVariation } from '@/api/workout';
import { Ionicons } from '@expo/vector-icons';
import { FilterChip } from '@/components/ui/FilterChip';
import { SegmentedToggle } from '@/components/ui/SegmentedToggle';
import { RecordChart } from '@/components/dashboard/RecordChart';
import { computeRecordWindow } from '@/utils/chart';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';
import { useActiveWorkout } from '@/contexts/active-workout';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const muscleGroupsMapping: Record<string, string[]> = {
  'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
  'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
  'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids'],
  'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes'],
  'Biceps': ['biceps', 'bicep'],
  'Triceps': ['triceps', 'tricep'],
  'Core': ['core', 'abs', 'abdominals', 'obliques'],
};

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
}

interface SessionSummary {
  sessionId: number;
  dateTime: string;
  duration: string;
  volume: number;
}

interface Variation {
  id: number;
  name: string;
  exercises: Exercise[];
  sessions: SessionSummary[];
}

// EF reference-handler shapes sometimes wrap arrays in { $values: [...] }.
const unwrap = (v: any): any[] => (v && v.$values ? v.$values : Array.isArray(v) ? v : []);

const formatDuration = (duration: string): string => {
  if (!duration) return '';
  const parts = duration.split(':');
  const h = parseInt(parts[0] ?? '0', 10);
  const m = parseInt(parts[1] ?? '0', 10);
  if (h > 0 && m > 0) return `${h} h ${m} min`;
  if (h > 0) return `${h} h`;
  return `${m} min`;
};

const durationToMinutes = (duration: string): number => {
  if (!duration) return 0;
  const [h, m, s] = duration.split(':').map(p => parseInt(p, 10) || 0);
  return h * 60 + m + s / 60;
};

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [variations, setVariations] = useState<Variation[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<'volume' | 'duration'>('volume');
  const [recordOffset, setRecordOffset] = useState(0);
  const [orderedExercises, setOrderedExercises] = useState<Exercise[]>([]);

  // Edit-mode working state (edits the currently selected gym + plan info)
  const [gymName, setGymName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);

  const [showAddExModal, setShowAddExModal] = useState(false);
  const [addExSearch, setAddExSearch] = useState('');
  const [addExMuscle, setAddExMuscle] = useState<string | null>(null);

  const { activeWorkout, discardActiveWorkout } = useActiveWorkout();
  const [conflictModalVisible, setConflictModalVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const exData = await fetchAllExercises();
      setAvailableExercises(unwrap(exData));

      if (id) {
        const workoutData = await fetchWorkoutById(id as string);
        setName(workoutData.name || "");
        setDescription(workoutData.description || "");

        const vars: Variation[] = unwrap(workoutData.variations).map((v: any) => ({
          id: v.id,
          name: v.name,
          exercises: unwrap(v.exercises),
          sessions: unwrap(v.sessions),
        }));
        setVariations(vars);

        // Keep the current selection if it still exists, else default to the first gym.
        setSelectedVariationId(prev =>
          prev && vars.some(v => v.id === prev) ? prev : (vars[0]?.id ?? null)
        );
      }
    } catch (err) {
      console.log("Error Loading", err);
      Alert.alert("Error", "Could not load workout details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Reload every time the screen regains focus so newly added gyms and finished
  // sessions show up immediately.
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const currentVariation = variations.find(v => v.id === selectedVariationId) || null;
  const sessions = currentVariation?.sessions ?? [];

  // Latest-5-records window for the training-volume chart. `sessions` is newest-first;
  // the value plotted depends on the selected metric (volume kg vs duration minutes).
  const chartWindow = useMemo(() => {
    const records = sessions.map(s => ({
      date: new Date(s.dateTime),
      value: chartMetric === 'volume' ? s.volume : durationToMinutes(s.duration),
    }));
    return computeRecordWindow(records, recordOffset);
  }, [sessions, chartMetric, recordOffset]);

  // Reset pagination to the latest window whenever the selected gym changes.
  useEffect(() => { setRecordOffset(0); }, [selectedVariationId]);

  // Whether the currently selected gym is the one with a live (unfinished) draft —
  // if so the footer button resumes it instead of offering to start a fresh one.
  const isActiveWorkoutHere = !!currentVariation && activeWorkout?.variationId === String(currentVariation.id);
  // True when a *different* gym/plan has a draft in progress — starting a new
  // workout here would silently strand or discard that one, so we ask first.
  const hasConflictingActiveWorkout = !!activeWorkout && !isActiveWorkoutHere;

  const goToCreateSession = useCallback(() => {
    if (!currentVariation) return;
    router.push({
      pathname: '/workout/create',
      params: {
        variationId: String(currentVariation.id),
        planName: name,
        gymName: currentVariation.name,
        exercisesJson: JSON.stringify(orderedExercises),
      },
    } as any);
  }, [currentVariation, name, orderedExercises, router]);

  const handleStartOrContinue = () => {
    if (!currentVariation) return;
    if (hasConflictingActiveWorkout) {
      setConflictModalVisible(true);
      return;
    }
    goToCreateSession();
  };

  const handleGoToActiveWorkout = () => {
    if (!activeWorkout) return;
    setConflictModalVisible(false);
    router.push({
      pathname: '/workout/create',
      params: {
        variationId: activeWorkout.variationId,
        planName: activeWorkout.planName,
        gymName: activeWorkout.gymName,
      },
    } as any);
  };

  const handleDiscardAndStartNew = async () => {
    await discardActiveWorkout();
    setConflictModalVisible(false);
    goToCreateSession();
  };

  // Local copy of the gym's exercises that the drag-to-reorder list edits directly,
  // re-synced whenever the gym switches or fresh data loads.
  useEffect(() => {
    setOrderedExercises(currentVariation?.exercises ?? []);
  }, [currentVariation]);

  const handleExerciseDragEnd = useCallback(({ data }: { data: Exercise[] }) => {
    setOrderedExercises(data);
    if (!currentVariation || !selectedVariationId) return;
    updateVariation(selectedVariationId, currentVariation.name, data.map(e => e.id)).catch(() => {
      Alert.alert('Error', 'Could not save the new exercise order.');
      setOrderedExercises(currentVariation.exercises);
    });
  }, [currentVariation, selectedVariationId]);

  const handleRemoveExercise = (exerciseId: number, exerciseName: string) => {
    if (!currentVariation || !selectedVariationId) return;
    const confirm = () => {
      const newIds = currentVariation.exercises.filter(e => e.id !== exerciseId).map(e => e.id);
      updateVariation(selectedVariationId, currentVariation.name, newIds)
        .then(loadData)
        .catch(() => Alert.alert('Error', 'Could not remove exercise.'));
    };
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${exerciseName}" from this gym?`)) confirm();
    } else {
      Alert.alert('Remove Exercise?', `Remove "${exerciseName}" from this gym?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: confirm },
      ]);
    }
  };

  const toggleExercise = (exerciseId: number) => {
    if (!isEditing) return;
    setSelectedIds(prev =>
      prev.includes(exerciseId) ? prev.filter(i => i !== exerciseId) : [...prev, exerciseId]
    );
  };

  const startEditing = () => {
    if (!currentVariation) return;
    setGymName(currentVariation.name);
    setSelectedIds(currentVariation.exercises.map(e => e.id));
    setSearchQuery("");
    setSelectedMuscle(null);
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    if (!name) {
      Alert.alert("Error", "Please provide a plan name.");
      return;
    }
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Select at least one exercise for this gym.");
      return;
    }
    try {
      setLoading(true);
      await updateWorkoutTemplate(id as string, name, description, selectedIds);
      if (selectedVariationId) {
        await updateVariation(selectedVariationId, gymName.trim() || "Gym", selectedIds);
      }
      setIsEditing(false);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not save changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async () => {
    Alert.alert("Delete Plan", "Are you sure you want to delete this whole plan and all its gyms?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteWorkoutTemplate(id as string);
            setModalVisible(false);
            router.replace('/(tabs)/home');
          } catch {
            Alert.alert("Error", "Could not delete plan");
          }
        }
      }
    ]);
  };

  const handleDeleteGym = () => {
    if (!currentVariation) return;
    if (variations.length <= 1) {
      Alert.alert("Can't remove", "A plan needs at least one gym. Delete the whole plan instead.");
      return;
    }
    Alert.alert("Delete Gym", `Remove "${currentVariation.name}" and its history from this plan?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await deleteVariation(currentVariation.id);
            setModalVisible(false);
            setSelectedVariationId(null); // loadData will pick the first remaining gym
            await loadData();
          } catch (err: any) {
            Alert.alert("Error", err?.message || "Could not delete gym");
          }
        }
      }
    ]);
  };

  const displayExercises = isEditing
    ? availableExercises.filter(exercise => {
        const matchesSearch = (exercise.name || "").toLowerCase().includes(searchQuery.toLowerCase());
        let matchesMuscle = true;
        if (selectedMuscle) {
          const exerciseMuscle = (exercise.muscleGroup || "").toLowerCase();
          const targetMuscles = muscleGroupsMapping[selectedMuscle] || [selectedMuscle.toLowerCase()];
          matchesMuscle = targetMuscles.some(m => exerciseMuscle.includes(m)) || exerciseMuscle === selectedMuscle.toLowerCase();
        }
        return matchesSearch && matchesMuscle;
      })
    : (currentVariation?.exercises ?? []);

  const quickAddExercises = useMemo(() => {
    const currentIds = new Set(currentVariation?.exercises.map(e => e.id) ?? []);
    return availableExercises
      .filter(e => !currentIds.has(e.id))
      .filter(e => (e.name || '').toLowerCase().includes(addExSearch.toLowerCase()))
      .filter(e => {
        if (!addExMuscle) return true;
        const m = (e.muscleGroup || '').toLowerCase();
        const targets = muscleGroupsMapping[addExMuscle] || [addExMuscle.toLowerCase()];
        return targets.some(t => m.includes(t)) || m === addExMuscle.toLowerCase();
      })
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [availableExercises, currentVariation, addExSearch, addExMuscle]);

  const handleQuickAddExercise = async (exercise: Exercise) => {
    if (!currentVariation || !selectedVariationId) return;
    try {
      const newIds = [...currentVariation.exercises.map(e => e.id), exercise.id];
      await updateVariation(selectedVariationId, currentVariation.name, newIds);
      setShowAddExModal(false);
      setAddExSearch('');
      setAddExMuscle(null);
      await loadData();
    } catch {
      Alert.alert("Error", "Could not add exercise. Please try again.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color={Palette.accent} /></View>
      ) : isEditing ? (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title Row */}
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { width: 32, height: 32 }]}>
                <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
              </TouchableOpacity>
              <ThemedText type="headingMedium" style={styles.title} numberOfLines={1}>
                Edit Plan
              </ThemedText>
              <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                <ThemedText type="bodyDefault" style={{ color: Palette.accent, fontWeight: '600' }}>Cancel</ThemedText>
              </TouchableOpacity>
            </View>

            <View style={styles.editSection}>
              <ThemedText type="bodySmall" style={styles.inputLabel}>Plan Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Chest Day"
                placeholderTextColor={Palette.textSecondary}
                value={name}
                onChangeText={setName}
              />
              <ThemedText type="bodySmall" style={[styles.inputLabel, { marginTop: Spacing.md }]}>Description (Optional)</ThemedText>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                placeholder="Add focus or notes..."
                placeholderTextColor={Palette.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
              />
              <ThemedText type="bodySmall" style={[styles.inputLabel, { marginTop: Spacing.md }]}>Gym</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="e.g., Apartment Gym"
                placeholderTextColor={Palette.textSecondary}
                value={gymName}
                onChangeText={setGymName}
              />
            </View>

            <ThemedText type="headingMedium" style={styles.editExercisesHeader}>
              Exercises at this gym ({selectedIds.length})
            </ThemedText>

            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={Palette.textSecondary} style={{ marginLeft: Spacing.lg }} />
              <TextInput
                style={styles.searchInputFlex}
                placeholder="Search exercises..."
                placeholderTextColor={Palette.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={18} color={Palette.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.filterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
            </View>

            {displayExercises.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.item, isSelected && styles.selectedItem]}
                  onPress={() => toggleExercise(item.id)}
                  activeOpacity={0.7}
                >
                  <View>
                    <ThemedText type="bodyLarge" style={[isSelected && styles.selectedText]}>
                      {item.name ?? "Unnamed Exercise"}
                    </ThemedText>
                    <ThemedText type="caption" style={[styles.muscleText, isSelected && styles.selectedText]}>
                      {item.muscleGroup ?? "Unspecified"}
                    </ThemedText>
                  </View>
                  {isSelected && (
                    <View style={styles.checkCircle}>
                      <Ionicons name="checkmark" size={16} color={Palette.textOnAccent} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Floating Footer Button */}
          <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} activeOpacity={0.8}>
              <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* The exercise list itself is the page's scroll container — nesting a
              draggable list inside a ScrollView made both fight over vertical swipes
              and froze scrolling. Everything else lives in the header/footer. */}
          <DraggableFlatList
            data={exercisesExpanded ? orderedExercises : []}
            keyExtractor={item => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            onDragEnd={handleExerciseDragEnd}
            ListHeaderComponent={
              <>
                {/* Title Row */}
                <View style={styles.titleRow}>
                  <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { width: 32, height: 32 }]}>
                    <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
                  </TouchableOpacity>
                  <ThemedText type="headingMedium" style={styles.title} numberOfLines={1}>
                    {name || "Loading..."}
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.moreButton}
                    onPress={() => setModalVisible(true)}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                  >
                    <Ionicons name="ellipsis-horizontal" size={24} color={Palette.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Training Volume Graph (for the selected gym) — latest 5 sessions, paginated */}
                <View style={styles.graphSection}>
                  {sessions.length === 0 ? (
                    <>
                      <ThemedText type="bodyLarge" style={styles.sectionHeaderTitle}>Training Volume</ThemedText>
                      <ThemedText type="bodySmall" style={styles.emptyText}>No sessions at this gym yet.</ThemedText>
                    </>
                  ) : (
                    <RecordChart
                      variant="bar"
                      title="Training Volume"
                      unit={chartMetric === 'volume' ? 'kg' : 'min'}
                      points={chartWindow.points}
                      periodLabel={chartWindow.periodLabel}
                      onPrev={() => setRecordOffset(o => o + 1)}
                      onNext={() => setRecordOffset(o => Math.max(o - 1, 0))}
                      canGoPrev={chartWindow.canGoPrev}
                      canGoNext={chartWindow.canGoNext}
                      headerRight={
                        <SegmentedToggle
                          options={[
                            { value: 'volume', label: 'Volume' },
                            { value: 'duration', label: 'Duration' },
                          ]}
                          value={chartMetric}
                          onChange={(v) => setChartMetric(v as 'volume' | 'duration')}
                        />
                      }
                    />
                  )}
                </View>

                {/* ── Gym selector ── */}
                <ThemedText type="bodySmall" style={styles.gymRowLabel}>GYM</ThemedText>
                <View style={styles.gymRow}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {variations.map(v => (
                      <FilterChip
                        key={v.id}
                        label={v.name}
                        selected={v.id === selectedVariationId}
                        onPress={() => setSelectedVariationId(v.id)}
                      />
                    ))}
                    <TouchableOpacity
                      style={styles.addGymChip}
                      activeOpacity={0.7}
                      onPress={() => router.push({ pathname: '/workout/new-template', params: { workoutId: id as string } } as any)}
                    >
                      <Ionicons name="add" size={16} color={Palette.accent} />
                      <ThemedText type="bodySmall" style={{ color: Palette.accent }}>Add Gym</ThemedText>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                <TouchableOpacity
                  style={styles.expandableHeader}
                  activeOpacity={0.7}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setExercisesExpanded(!exercisesExpanded);
                  }}
                >
                  <ThemedText type="bodyLarge">Exercises ({orderedExercises.length})</ThemedText>
                  <Ionicons name={exercisesExpanded ? "chevron-up" : "chevron-down"} size={20} color={Palette.textSecondary} />
                </TouchableOpacity>
              </>
            }
            ListEmptyComponent={exercisesExpanded ? (
              <ThemedText type="bodySmall" style={styles.emptyText}>No exercises for this gym.</ThemedText>
            ) : null}
            renderItem={({ item, drag, isActive }) => (
              <ScaleDecorator activeScale={0.97}>
                <View style={[styles.item, isActive && styles.itemDragging]}>
                  <View style={{ flex: 1 }}>
                    <ThemedText type="bodyLarge">{item.name ?? 'Unnamed Exercise'}</ThemedText>
                    <ThemedText type="caption" style={styles.muscleText}>{item.muscleGroup ?? 'Unspecified'}</ThemedText>
                  </View>
                  <TouchableOpacity onLongPress={drag} delayLongPress={1000} style={styles.dragHandle} activeOpacity={0.6}>
                    <Ionicons name="reorder-three-outline" size={22} color={Palette.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleRemoveExercise(item.id, item.name)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.removeExBtn}
                  >
                    <Ionicons name="close" size={18} color={Palette.textSecondary} />
                  </TouchableOpacity>
                </View>
              </ScaleDecorator>
            )}
            ListFooterComponent={
              <>
                {exercisesExpanded && (
                  <TouchableOpacity
                    style={styles.addExerciseBtn}
                    onPress={() => setShowAddExModal(true)}
                    activeOpacity={0.75}
                  >
                    <Ionicons name="add-circle-outline" size={18} color={Palette.accent} />
                    <ThemedText style={styles.addExerciseBtnText}>Add Exercise</ThemedText>
                  </TouchableOpacity>
                )}

                {/* Session History Section (for the selected gym) */}
                <View style={styles.historySection}>
                  <View style={styles.historyHeader}>
                    <ThemedText type="bodyLarge">History ({sessions.length})</ThemedText>
                    {sessions.length > 0 && (
                      <TouchableOpacity onPress={() => router.push(`/workout/${id}/sessions` as any)}>
                        <ThemedText type="bodySmall" style={{ color: Palette.accent }}>View All</ThemedText>
                      </TouchableOpacity>
                    )}
                  </View>
                  {sessions.length === 0 ? (
                    <ThemedText type="bodySmall" style={styles.emptyText}>No sessions at this gym yet.</ThemedText>
                  ) : (
                    sessions.slice(0, 5).map((session, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.historyCard}
                        activeOpacity={0.8}
                        onPress={() => router.push(`/workout/${id}/session/${session.sessionId}` as any)}
                      >
                        <View style={styles.historyCardRow}>
                          <ThemedText type="bodyLarge">
                            {new Date(session.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </ThemedText>
                          <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{formatDuration(session.duration)}</ThemedText>
                        </View>
                        <View style={styles.historyCardStats}>
                          <Ionicons name="bar-chart-outline" size={16} color={Palette.accent} />
                          <ThemedText type="bodySmall" style={{ color: Palette.accent }}>{session.volume} kg Total</ThemedText>
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </>
            }
          />

          {/* Floating Footer Button */}
          <View style={[styles.footer, { paddingBottom: Spacing.md + insets.bottom }]}>
            <TouchableOpacity
              style={[styles.startButton, !currentVariation && { opacity: 0.5 }]}
              disabled={!currentVariation}
              onPress={handleStartOrContinue}
              activeOpacity={0.8}
            >
              <ThemedText style={styles.startButtonText}>
                {isActiveWorkoutHere ? "Continue Workout" : "Start Workout"}{currentVariation ? ` · ${currentVariation.name}` : ""}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Quick Add Exercise Modal */}
      <Modal visible={showAddExModal} animationType="slide" transparent onRequestClose={() => { setShowAddExModal(false); setAddExSearch(''); setAddExMuscle(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowAddExModal(false); setAddExSearch(''); setAddExMuscle(null); }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.quickAddSheet}>
            <View style={styles.quickAddHeader}>
              <ThemedText type="headingMedium">Add Exercise</ThemedText>
              <TouchableOpacity onPress={() => { setShowAddExModal(false); setAddExSearch(''); setAddExMuscle(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.quickAddSearch}>
              <Ionicons name="search" size={16} color={Palette.textSecondary} />
              <TextInput
                style={styles.quickAddSearchInput}
                placeholder="Search exercises..."
                placeholderTextColor={Palette.textSecondary}
                value={addExSearch}
                onChangeText={setAddExSearch}
                autoFocus
              />
              {addExSearch.length > 0 && (
                <TouchableOpacity onPress={() => setAddExSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Palette.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.quickAddFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterChip label="All" selected={addExMuscle === null} onPress={() => setAddExMuscle(null)} />
                {['Chest', 'Back', 'Shoulder', 'Legs', 'Biceps', 'Triceps', 'Core'].map(muscle => (
                  <FilterChip
                    key={muscle}
                    label={muscle}
                    selected={addExMuscle === muscle}
                    onPress={() => setAddExMuscle(muscle === addExMuscle ? null : muscle)}
                  />
                ))}
              </ScrollView>
            </View>
            <View style={{ flex: 1 }}>
              <FlatList
                data={quickAddExercises}
                keyExtractor={item => String(item.id)}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.quickAddItem} onPress={() => handleQuickAddExercise(item)} activeOpacity={0.7}>
                    <View>
                      <ThemedText type="bodyLarge">{item.name}</ThemedText>
                      <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{item.muscleGroup}</ThemedText>
                    </View>
                    <Ionicons name="add-circle" size={22} color={Palette.accent} />
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Palette.border }} />}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <ThemedText type="bodySmall" style={styles.emptyText}>No exercises to add.</ThemedText>
                }
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Action Bottom Sheet Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.dragIndicator} />
            <ThemedText type="bodySmall" style={styles.sheetTitle}>Plan Actions</ThemedText>

            <TouchableOpacity style={styles.actionItem} onPress={() => { setModalVisible(false); startEditing(); }}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="create-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Edit Plan & Current Gym</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => { setModalVisible(false); router.push({ pathname: '/workout/new-template', params: { workoutId: id as string } } as any); }}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="add-circle-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Add Another Gym</ThemedText>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionItem} onPress={() => { setModalVisible(false); handleDeleteGym(); }}>
              <View style={[styles.actionIconCircle, { backgroundColor: Palette.dangerLight }]}>
                <Ionicons name="remove-circle-outline" size={20} color={Palette.danger} />
              </View>
              <ThemedText type="bodyDefault" style={{ color: Palette.danger }}>
                Delete Gym{currentVariation ? ` (${currentVariation.name})` : ""}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={handleDeletePlan}>
              <View style={[styles.actionIconCircle, { backgroundColor: Palette.dangerLight }]}>
                <Ionicons name="trash-outline" size={20} color={Palette.danger} />
              </View>
              <ThemedText type="bodyDefault" style={{ color: Palette.danger }}>Delete Whole Plan</ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Active Workout Conflict Modal — shown when starting a workout here would
          strand an unfinished draft for a different gym/plan */}
      <Modal visible={conflictModalVisible} transparent animationType="fade" onRequestClose={() => setConflictModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setConflictModalVisible(false)}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.dragIndicator} />
            <ThemedText type="bodySmall" style={styles.sheetTitle}>Workout In Progress</ThemedText>
            <ThemedText type="bodyDefault" style={styles.conflictMessage}>
              You have an unfinished workout for &quot;{activeWorkout?.gymName}&quot;
              {activeWorkout ? ` (${Math.max(1, Math.round((Date.now() - activeWorkout.startTime) / 60000))} min so far)` : ""}.
              Starting a new one will discard it.
            </ThemedText>

            <TouchableOpacity style={styles.actionItem} onPress={handleGoToActiveWorkout}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="play-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Go to Active Workout</ThemedText>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={styles.actionItem} onPress={handleDiscardAndStartNew}>
              <View style={[styles.actionIconCircle, { backgroundColor: Palette.dangerLight }]}>
                <Ionicons name="trash-outline" size={20} color={Palette.danger} />
              </View>
              <ThemedText type="bodyDefault" style={{ color: Palette.danger }}>Discard & Start New</ThemedText>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: 120,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
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
  title: {
    flex: 1,
    color: Palette.textPrimary,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  cancelButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  editSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    color: Palette.textSecondary,
    marginBottom: Spacing.xs,
    marginLeft: 4,
  },
  input: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
    color: Palette.textPrimary,
    backgroundColor: Palette.surface,
  },
  editExercisesHeader: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
  },
  searchInputFlex: {
    flex: 1,
    minHeight: 48,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
    color: Palette.textPrimary,
  },
  clearButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  filterContainer: {
    marginBottom: Spacing.lg,
  },
  gymRowLabel: {
    color: Palette.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 11,
  },
  gymRow: {
    marginBottom: Spacing.sm,
  },
  addGymChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Palette.accentLight,
    borderWidth: 1.5,
    borderColor: Palette.accent,
    borderStyle: 'dashed',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Palette.surface,
    marginBottom: Spacing.sm + 2,
    ...Shadows.card,
    ...Platform.select({
      android: {
        elevation: 0,
        borderWidth: 1,
        borderColor: Palette.border,
      },
      default: {
        borderWidth: 0,
      }
    }),
  },
  selectedItem: {
    backgroundColor: Palette.accent,
    borderWidth: 2,
    borderColor: Palette.accent,
    padding: Spacing.lg - 2,
  },
  itemDragging: {
    backgroundColor: Palette.surfaceAlt,
    ...Shadows.button,
  },
  muscleText: {
    color: Palette.textSecondary,
    marginTop: 2,
  },
  selectedText: {
    color: Palette.textOnAccent,
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
    backgroundColor: 'transparent',
  },
  saveButton: {
    backgroundColor: Palette.accent,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.button,
  },
  saveButtonText: {
    color: Palette.textOnAccent,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bodyLarge.fontFamily,
  },
  startButton: {
    backgroundColor: Palette.accent,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    alignItems: 'center',
    ...Shadows.button,
  },
  startButtonText: {
    color: Palette.textOnAccent,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bodyLarge.fontFamily,
  },
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
  conflictMessage: {
    color: Palette.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
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
  divider: {
    height: 1,
    backgroundColor: Palette.border,
    marginVertical: Spacing.sm,
  },
  graphSection: {
    marginVertical: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  sectionHeaderTitle: {
    marginBottom: Spacing.lg,
    color: Palette.textPrimary,
  },
  expandableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  dragHandle: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeExBtn: {
    padding: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  addExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Palette.accent,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  addExerciseBtnText: {
    color: Palette.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  quickAddSheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '80%',
    paddingBottom: 40,
  },
  quickAddHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  quickAddSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  quickAddSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    padding: 0,
  },
  quickAddFilterRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  quickAddItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  emptyText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    padding: Spacing.xl,
  },
  historySection: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xxl + Spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  historyCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  historyCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  historyCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});

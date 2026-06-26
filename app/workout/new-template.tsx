import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, Alert, View, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createWorkoutTemplate, createVariation, fetchAllExercises } from '@/api/workout';
import { FilterChip } from '@/components/ui/FilterChip';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
}

export default function CreateWorkoutScreen() {
  const router = useRouter();
  // When workoutId is present we're adding a new "Gym" to an existing plan,
  // otherwise we're creating a brand new plan (with its first gym).
  const { workoutId } = useLocalSearchParams();
  const isAddGym = !!workoutId;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  // gymName only used in Add Gym mode; creating a plan always starts with gym "Main"
  const [gymName, setGymName] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscleGroupsMapping: Record<string, string[]> = {
    'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
    'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
    'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids'],
    'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes'],
    'Biceps': ['biceps', 'bicep'],
    'Triceps': ['triceps', 'tricep'],
    'Core': ['core', 'abs', 'abdominals', 'obliques'],
  };

  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = (exercise.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    let matchesMuscle = true;
    if (selectedMuscle) {
      const exerciseMuscle = (exercise.muscleGroup || "").toLowerCase();
      const targetMuscles = muscleGroupsMapping[selectedMuscle] || [selectedMuscle.toLowerCase()];
      matchesMuscle = targetMuscles.some(m => exerciseMuscle.includes(m)) || exerciseMuscle === selectedMuscle.toLowerCase();
    }
    return matchesSearch && matchesMuscle;
  });

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const data = await fetchAllExercises();
        if (Array.isArray(data)) {
          setAvailableExercises(data);
        } else if (data && data.$values) {
          setAvailableExercises(data.$values);
        }
      } catch (err) {
        console.log("Error Loading", err);
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, []);

  const toggleExercise = useCallback((id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      Alert.alert("Error", "Select at least one exercise.");
      return;
    }
    if (!isAddGym && !name) {
      Alert.alert("Error", "Please give your plan a name.");
      return;
    }
    try {
      setSaving(true);
      if (isAddGym) {
        await createVariation(workoutId as string, gymName.trim() || "Gym", selectedIds);
        router.back();
      } else {
        await createWorkoutTemplate(name, description, gymName.trim() || "Main", selectedIds);
        router.replace('/(tabs)/home');
      }
    } catch {
      Alert.alert("Error", isAddGym ? "Could not add gym." : "Could not save plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Title Row: back button + title — scrollable together */}
          <View style={styles.titleRow}>
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { width: 32, height: 32 }]}>
              <Ionicons name="chevron-back" size={20} color={Palette.textPrimary} />
            </TouchableOpacity>
            <ThemedText type="headingMedium" style={styles.title}>{isAddGym ? "Add Gym" : "Create Plan"}</ThemedText>
          </View>

          {/* Form fields */}
          <View style={styles.form}>
            {!isAddGym && (
              <>
                <ThemedText type="bodySmall" style={styles.inputLabel}>Plan Name</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Chest Day"
                  placeholderTextColor={Palette.textSecondary}
                  value={name}
                  onChangeText={setName}
                />
                <ThemedText type="bodySmall" style={[styles.inputLabel, { marginTop: Spacing.md }]}>Description</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="Focus areas, goals..."
                  placeholderTextColor={Palette.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                />
              </>
            )}

            {isAddGym && (
              <>
                <ThemedText type="bodySmall" style={styles.inputLabel}>Gym Name</ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., School Gym"
                  placeholderTextColor={Palette.textSecondary}
                  value={gymName}
                  onChangeText={setGymName}
                />
                <ThemedText type="caption" style={styles.gymHint}>
                  Pick the exercises you do for this plan at this gym.
                </ThemedText>
              </>
            )}
          </View>

          <ThemedText type="headingMedium" style={styles.selectionHeader}>
            Exercises ({selectedIds.length})
          </ThemedText>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={Palette.textSecondary} style={{ marginLeft: Spacing.lg }} />
            <TextInput
              style={styles.searchInputFlex}
              placeholder="Search..."
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

          {/* Filter chips */}
          <View style={styles.filterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FilterChip
                label="All"
                selected={selectedMuscle === null}
                onPress={() => setSelectedMuscle(null)}
              />
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

          {loading && <ActivityIndicator size="small" color={Palette.accent} style={{ marginTop: Spacing.md }} />}

          {/* Exercise list — using .map() instead of FlatList to avoid input focus bugs */}
          {filteredExercises.map((item) => {
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
                    {item.name}
                  </ThemedText>
                  <ThemedText type="caption" style={[styles.muscleText, isSelected && styles.selectedText]}>
                    {item.muscleGroup}
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.saveButton, saving && { opacity: 0.6 }]} onPress={handleSave} activeOpacity={0.8} disabled={saving}>
          <ThemedText style={styles.saveButtonText}>{isAddGym ? "Add Gym" : "Create Plan"}</ThemedText>
        </TouchableOpacity>
      </View>
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
  form: {
    marginBottom: Spacing.xxl,
  },
  gymHint: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: 4,
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
  selectionHeader: {
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
        elevation: 0, // Prevent shadow clipping artifacts
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
    padding: Spacing.lg - 2, // Compensate for 2px border to prevent jump
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
    paddingBottom: 40,
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
});
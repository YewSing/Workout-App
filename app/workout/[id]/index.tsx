import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, View, ActivityIndicator, ScrollView, Modal, Platform, UIManager, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchWorkoutById, updateWorkoutTemplate, fetchAllExercises, deleteWorkoutTemplate } from '@/api/workout';
import { Ionicons } from '@expo/vector-icons';
import { FilterChip } from '@/components/ui/FilterChip';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

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

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [exercisesExpanded, setExercisesExpanded] = useState(false);
  const [expandAnim] = useState(new Animated.Value(0));

  const muscleGroupsMapping: Record<string, string[]> = {
    'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
    'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
    'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids'],
    'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes']
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const exData = await fetchAllExercises();
        if (Array.isArray(exData)) {
          setAvailableExercises(exData);
        } else if (exData && exData.$values) {
          setAvailableExercises(exData.$values);
        }

        if (id) {
            const workoutData = await fetchWorkoutById(id as string);
            setName(workoutData.name || "");
            setDescription(workoutData.description || "");
            
            if (workoutData.exercises && workoutData.exercises.$values) {
              setSelectedIds(workoutData.exercises.$values.map((ex: any) => ex.id));
            } else if (Array.isArray(workoutData.exercises)) {
              setSelectedIds(workoutData.exercises.map((ex: any) => ex.id));
            }

            if (workoutData.sessions && workoutData.sessions.$values) {
              setSessions(workoutData.sessions.$values);
            } else if (Array.isArray(workoutData.sessions)) {
              setSessions(workoutData.sessions);
            }
        }
      } catch (err) {
        console.log("Error Loading", err);
        Alert.alert("Error", "Could not load workout details.");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const toggleExercise = (exerciseId: number) => {
    if (!isEditing) return; 
    setSelectedIds(prev => 
      prev.includes(exerciseId) ? prev.filter(i => i !== exerciseId) : [...prev, exerciseId]
    );
  };

  const handleUpdate = async () => {
    if (!name || selectedIds.length === 0) {
      Alert.alert("Error", "Please provide a name and select at least one exercise.");
      return;
    }
    
    try {
      setLoading(true);
      await updateWorkoutTemplate(id as string, name, description, selectedIds);
      Alert.alert("Success", "Workout template updated!");
      setIsEditing(false); 
    } catch (e) {
      Alert.alert("Error", "Could not save template changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
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
              await deleteWorkoutTemplate(id as string);
              setModalVisible(false);
              router.replace('/(tabs)/home');
            } catch (err) {
              Alert.alert("Error", "Could not delete template");
            }
          }
        }
      ]
    );
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
    : availableExercises.filter(exercise => selectedIds.includes(exercise.id)); 

  return (
    <ThemedView style={styles.container}>
      {loading ? (
         <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color={Palette.accent} /></View>
      ) : (
        <View style={{ flex: 1 }}>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Title Row: back button + title + 3-dots — all scrollable */}
            <View style={styles.titleRow}>
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
              </TouchableOpacity>
              <ThemedText type="displayLarge" style={styles.title} numberOfLines={1}>
                {isEditing ? "Edit Template" : (name || "Loading...")}
              </ThemedText>
              {!isEditing ? (
                <TouchableOpacity 
                  style={styles.moreButton} 
                  onPress={() => setModalVisible(true)}
                  hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                >
                  <Ionicons name="ellipsis-horizontal" size={24} color={Palette.textPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setIsEditing(false)} style={styles.cancelButton}>
                  <ThemedText type="bodyDefault" style={{ color: Palette.accent, fontWeight: '600' }}>Cancel</ThemedText>
                </TouchableOpacity>
              )}
            </View>
            
            {isEditing ? (
                <View style={styles.editSection}>
                  <ThemedText type="bodySmall" style={styles.inputLabel}>Template Name</ThemedText>
                  <TextInput 
                      style={styles.input} 
                      placeholder="e.g., Push Day" 
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
                </View>
            ) : (
                <View>
                  {/* Volume History Graph */}
                  <View style={styles.graphSection}>
                    <ThemedText type="bodyLarge" style={styles.sectionHeaderTitle}>Volume History</ThemedText>
                    <View style={sessions.length > 0 ? styles.graphContainer : { paddingVertical: Spacing.sm }}>
                      {sessions.length === 0 ? (
                        <ThemedText type="bodySmall" style={styles.emptyText}>No sessions yet.</ThemedText>
                      ) : (
                        sessions.slice(0, 7).reverse().map((s, idx) => {
                          const maxHeight = 80;
                          const maxVol = Math.max(...sessions.map(s => s.volume)) || 1;
                          const barHeight = Math.max(10, (s.volume / maxVol) * maxHeight);
                          const dateObj = new Date(s.dateTime);
                          const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                          return (
                            <View key={idx} style={styles.graphBarContainer}>
                              <View style={[styles.graphBar, { height: barHeight, backgroundColor: Palette.accent }]} />
                              <ThemedText type="caption" style={styles.graphLabel}>{dayLabel}</ThemedText>
                            </View>
                          );
                        })
                      )}
                    </View>
                  </View>
                </View>
            )}

            {isEditing ? (
               <ThemedText type="headingMedium" style={styles.editExercisesHeader}>
                 Select Exercises ({selectedIds.length})
               </ThemedText>
            ) : (
               <TouchableOpacity 
                  style={styles.expandableHeader}
                  activeOpacity={0.7}
                  onPress={() => {
                      const toValue = exercisesExpanded ? 0 : 1;
                      setExercisesExpanded(!exercisesExpanded);
                      Animated.timing(expandAnim, {
                          toValue,
                          duration: 300,
                          useNativeDriver: false,
                      }).start();
                  }}
               >
                  <ThemedText type="bodyLarge">Exercises ({selectedIds.length})</ThemedText>
                  <Ionicons name={exercisesExpanded ? "chevron-up" : "chevron-down"} size={20} color={Palette.textSecondary} />
               </TouchableOpacity>
            )}

            {isEditing && (
                <>
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
                            <FilterChip
                              label="All"
                              selected={selectedMuscle === null}
                              onPress={() => setSelectedMuscle(null)}
                            />
                            {['Chest', 'Back', 'Shoulder', 'Legs'].map(muscle => (
                                <FilterChip
                                  key={muscle}
                                  label={muscle}
                                  selected={selectedMuscle === muscle}
                                  onPress={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                                />
                            ))}
                        </ScrollView>
                    </View>
                </>
            )}

            {/* Exercises List (View Mode) - collapsed by default */}
            {!isEditing && (
               <Animated.View style={{ 
                 overflow: 'hidden',
                 maxHeight: expandAnim.interpolate({
                   inputRange: [0, 1],
                   outputRange: [0, 2000]
                 }),
                 opacity: expandAnim
               }}>
                    {displayExercises.map((item) => (
                      <View key={item.id} style={styles.item}>
                        <View>
                          <ThemedText type="bodyLarge">{item.name ?? "Unnamed Exercise"}</ThemedText>
                          <ThemedText type="caption" style={styles.muscleText}>{item.muscleGroup ?? "Unspecified"}</ThemedText>
                        </View>
                      </View>
                    ))}
                    {displayExercises.length === 0 && (
                      <ThemedText type="bodySmall" style={styles.emptyText}>No exercises selected.</ThemedText>
                    )}
               </Animated.View>
            )}

            {/* Exercises List (Edit Mode) */}
            {isEditing && displayExercises.map((item) => {
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

            {/* Session History Section */}
            {!isEditing && (
              <View style={styles.historySection}>
                 <ThemedText type="bodyLarge" style={styles.sectionHeaderTitle}>History</ThemedText>
                 {sessions.length === 0 ? (
                   <ThemedText type="bodySmall" style={styles.emptyText}>You haven't completed this workout yet.</ThemedText>
                 ) : (
                   sessions.map((session, idx) => (
                      <View key={idx} style={styles.historyCard}>
                         <View style={styles.historyCardRow}>
                            <ThemedText type="bodyLarge">
                               {new Date(session.dateTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </ThemedText>
                            <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{session.duration.substring(0, 5)}</ThemedText>
                         </View>
                         <View style={styles.historyCardStats}>
                            <Ionicons name="bar-chart-outline" size={16} color={Palette.accent} />
                            <ThemedText type="bodySmall" style={{ color: Palette.accent }}>{session.volume} lbs Total</ThemedText>
                         </View>
                      </View>
                   ))
                 )}
              </View>
            )}
          </ScrollView>

          {/* Floating Footer Button */}
          <View style={styles.footer}>
            {isEditing ? (
              <TouchableOpacity style={styles.saveButton} onPress={handleUpdate} activeOpacity={0.8}>
                <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.startButton} onPress={() => router.push('/session/new' as any)} activeOpacity={0.8}>
                <ThemedText style={styles.startButtonText}>Start Workout</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Action Bottom Sheet Modal */}
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
                setIsEditing(true);
            }}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="create-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Edit Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Duplicate template feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="copy-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Duplicate Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Pin to Top feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="star-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Pin to Top</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Share feature")}>
              <View style={styles.actionIconCircle}>
                <Ionicons name="share-outline" size={20} color={Palette.textPrimary} />
              </View>
              <ThemedText type="bodyDefault">Share Template</ThemedText>
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
        elevation: 0, // Disable elevation to prevent "gray line" clipping artifacts during animation
        borderWidth: 1,
        borderColor: Palette.border, // Use a subtle border instead for definition
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
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 100,
  },
  graphBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 14,
    borderRadius: 7,
    marginBottom: Spacing.sm,
  },
  graphLabel: {
    color: Palette.textSecondary,
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
  historySection: {
    marginTop: Spacing.xl,
    paddingBottom: Spacing.xxl + Spacing.sm,
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
  emptyText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    marginTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
});

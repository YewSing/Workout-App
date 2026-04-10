import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, View, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { fetchWorkoutById, updateWorkoutTemplate, fetchAllExercises, deleteWorkoutTemplate } from '@/api/workout';
import { Ionicons } from '@expo/vector-icons';

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
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

  const handleAction = async () => {
    if (!isEditing) {
      setIsEditing(true);
      return;
    }

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
         <View style={{flex: 1, justifyContent: 'center'}}><ActivityIndicator size="large" color="#007AFF" /></View>
      ) : (
        <View style={{ flex: 1 }}>
          <View style={styles.header}>
              <ThemedText type="title" style={styles.title}>
                  {isEditing ? "Edit Template" : "Template Detail"}
              </ThemedText>
              {!isEditing && (
                <TouchableOpacity onPress={() => setModalVisible(true)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                   <Ionicons name="ellipsis-horizontal" size={24} color="#888" />
                </TouchableOpacity>
              )}
          </View>
          
          {isEditing ? (
              <TextInput 
                  style={styles.input} 
                  placeholder="Workout Name (e.g., Push Day)" 
                  placeholderTextColor="#888"
                  value={name} 
                  onChangeText={setName} 
              />
          ) : (
              <ThemedText type="subtitle" style={styles.workoutNameDisplay}>{name}</ThemedText>
          )}

          <ThemedText type="defaultSemiBold" style={{ marginTop: 24, marginBottom: 12 }}>
            {isEditing ? `Select Exercises (${selectedIds.length})` : `Exercises in ${name}`}
          </ThemedText>

          {isEditing && (
              <>
                  <View style={styles.searchContainer}>
                      <TextInput
                          style={styles.searchInputFlex}
                          placeholder="Search exercises..."
                          placeholderTextColor="#888"
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                      />
                      {searchQuery.length > 0 && (
                          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                              <ThemedText style={styles.clearButtonText}>✕</ThemedText>
                          </TouchableOpacity>
                      )}
                  </View>

                  <View style={styles.filterContainer}>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          <TouchableOpacity 
                              style={[styles.filterButton, selectedMuscle === null && styles.filterButtonSelected]} 
                              onPress={() => setSelectedMuscle(null)}
                          >
                              <ThemedText style={[styles.filterText, selectedMuscle === null && styles.filterTextSelected]}>All</ThemedText>
                          </TouchableOpacity>
                          {['Chest', 'Back', 'Shoulder', 'Legs'].map(muscle => (
                              <TouchableOpacity 
                                  key={muscle}
                                  style={[styles.filterButton, selectedMuscle === muscle && styles.filterButtonSelected]} 
                                  onPress={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                              >
                                  <ThemedText style={[styles.filterText, selectedMuscle === muscle && styles.filterTextSelected]}>{muscle}</ThemedText>
                              </TouchableOpacity>
                          ))}
                      </ScrollView>
                  </View>
              </>
          )}

          <FlatList
            data={displayExercises}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={{ paddingBottom: 100 }} 
            renderItem={({ item }) => {
              const itemId = item.id;
              const itemName = item.name ?? "Unnamed Exercise";
              const itemMuscle = item.muscleGroup ?? "Unspecified";
              const isSelected = selectedIds.includes(itemId);
              return (
                <TouchableOpacity 
                  style={[styles.item, isSelected && isEditing && styles.selectedItem]}
                  onPress={() => toggleExercise(itemId)}
                  activeOpacity={isEditing ? 0.7 : 1}
                >
                  <View>
                    <ThemedText style={[styles.exerciseName, isSelected && isEditing && styles.selectedText]}>
                      {itemName}
                    </ThemedText>
                    <ThemedText style={[styles.muscleText, isSelected && isEditing && styles.selectedText]}>
                      {itemMuscle}
                    </ThemedText>
                  </View>
                  {isSelected && isEditing && <ThemedText style={styles.checkmark}>✓</ThemedText>}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
                <ThemedText style={{textAlign: 'center', opacity: 0.5, marginTop: 20}}>
                    No exercises found.
                </ThemedText>
            )}
          />

          <View style={styles.footer}>
            <TouchableOpacity style={styles.saveButton} onPress={handleAction}>
              <ThemedText style={styles.saveButtonText}>
                  {isEditing ? "Save Changes" : "Update Template"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Action Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.dragIndicator} />
            <ThemedText style={styles.sheetTitle}>Template Actions</ThemedText>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Duplicate template feature")}>
              <Ionicons name="copy-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Duplicate Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Pin to Top feature")}>
              <Ionicons name="star-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Pin to Top</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Share feature")}>
              <Ionicons name="share-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Share Template</ThemedText>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={[styles.actionItem, styles.destructiveAction]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <ThemedText style={[styles.actionText, { color: '#FF3B30' }]}>Delete Template</ThemedText>
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
    padding: 24,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
  },
  workoutNameDisplay: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
  },
  input: {
    minHeight: 54,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000', 
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingRight: 8,
  },
  searchInputFlex: {
    flex: 1,
    minHeight: 54,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    color: '#999',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 8,
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
  },
  filterText: {
    fontSize: 14,
    color: '#333',
  },
  filterTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedItem: {
    backgroundColor: '#007AFF',
    borderColor: '#0056b3',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  muscleText: {
    fontSize: 12,
    opacity: 0.6,
  },
  selectedText: {
    color: '#fff',
    opacity: 1,
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 20,
    backgroundColor: 'transparent'
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 24, 
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40, 
    height: 5, 
    backgroundColor: '#DDDDDD', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 16, 
    opacity: 0.5
  },
  actionItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    gap: 12
  },
  actionText: {
    fontSize: 16, 
    color: '#000'
  },
  divider: {
    height: 1, 
    backgroundColor: '#EEE', 
    marginVertical: 8
  },
  destructiveAction: {
    marginTop: 8
  }
});

import React, { useState, useEffect } from 'react';
import { StyleSheet, TextInput, FlatList, TouchableOpacity, Alert, View, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { createWorkoutTemplate, fetchAllExercises } from '@/api/workout';

interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
}

export default function CreateWorkoutScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const router = useRouter();

  const muscleGroupsMapping: Record<string, string[]> = {
    'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
    'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
    'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids'],
    'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes']
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
        } else {
          Alert.alert("API Response Debug", typeof data === 'object' ? JSON.stringify(data) : String(data));
          setAvailableExercises([]);
        }
      } catch (err) {
        console.log("Error Loading", String(err));
      } finally {
        setLoading(false);
      }
    };
    loadExercises();
  }, []);

  const toggleExercise = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    console.log("Saving");
    if (!name || selectedIds.length === 0) {
      Alert.alert("Error", "Please provide a name and select at least one exercise.");
      return;
    }
    try {
      await createWorkoutTemplate(name, description, selectedIds);
      Alert.alert("Success", "Workout template created!");
      router.replace('/(tabs)/home');
    } catch (e) {
      Alert.alert("Error", "Could not save template.");
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>New Workout Plan</ThemedText>
      
      <TextInput 
        style={styles.input} 
        placeholder="Workout Name (e.g., Push Day)" 
        placeholderTextColor="#888"
        value={name} 
        onChangeText={setName} 
      />

      <ThemedText type="subtitle" style={{ marginTop: 24, marginBottom: 12 }}>
        Select Exercises ({selectedIds.length})
      </ThemedText>

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

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          contentContainerStyle={{ paddingBottom: 100 }} // Space for the save button
          renderItem={({ item }) => {
            const itemId = item.id ;
            const itemName = item.name ?? "Unnamed Exercise";
            const itemMuscle = item.muscleGroup ?? "Unspecified";
            const isSelected = selectedIds.includes(itemId);
            return (
              <TouchableOpacity 
                style={[styles.item, isSelected && styles.selectedItem]}
                onPress={() => toggleExercise(itemId)}
                activeOpacity={0.7}
              >
                <View>
                  <ThemedText style={[styles.exerciseName, isSelected && styles.selectedText]}>
                    {itemName}
                  </ThemedText>
                  <ThemedText style={[styles.muscleText, isSelected && styles.selectedText]}>
                    {itemMuscle}
                  </ThemedText>
                </View>
                {isSelected && <ThemedText style={styles.checkmark}>✓</ThemedText>}
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <ThemedText style={styles.saveButtonText}>Save Template</ThemedText>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
    marginBottom: 12,
},
  title: {
    marginBottom: 20,
  },
  input: {
    minHeight: 54,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000', // Ensure text is visible; adapt for dark mode if needed
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
    bottom: 40,
    left: 24,
    right: 24,
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
});
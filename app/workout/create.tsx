import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";

export default function CreateSession() {
  const router = useRouter();

  const { id, mode } = useLocalSearchParams();
  
  // mode = "create" | "view"
  const isViewMode = mode === "view";

  // Mock workout name based on id
  const workoutNames: Record<string, string> = {
    "1": "Push Day",
    "2": "Pull Day",
    "3": "Leg Day",
  };
  const workoutName = workoutNames[id] || "Workout Session";

  // State
  // const [date, setDate] = useState("");
  const getToday = () => {
    return new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  };

  const [date, setDate] = useState(getToday());

  const [duration, setDuration] = useState(""); // hh:mm:ss

  const [exercises, setExercises] = useState<Array<any>>([
    { id: "e1", name: "Bench Press", remark: "", weight: "", reps: "", lastWeight: "50kg", lastReps: "10" },
    { id: "e2", name: "Incline DB Press", remark: "", weight: "", reps: "", lastWeight: "40kg", lastReps: "10" },
    { id: "e3", name: "Pec Fly Machine", remark: "", weight: "", reps: "", lastWeight: "60kg", lastReps: "12" },
  ]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const addExercise = () => {
    const newId = `e${exercises.length + 1}`;
    setExercises([...exercises, { id: newId, name: `Exercise ${exercises.length + 1}`, remark: "", weight: "", reps: "", lastWeight: "-", lastReps: "-" }]);
  };

  const updateExercise = (id: string, field: string, value: string) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const finishWorkout = () => {
    console.log("Finish workout:", { date, duration, exercises });
    alert("Workout finished!"); // replace with backend save later
    router.back();
  };

  const totalVolume = exercises.reduce((sum, ex) => {
    const w = parseFloat(ex.weight) || 0;
    const r = parseFloat(ex.reps) || 0;
    return sum + w * r;
  }, 0);

  return (
    <ScrollView style={styles.container}>
      {/* Workout name */}
      <Text style={styles.workoutName}>{workoutName}</Text>

      {/* Date & Duration */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Duration (hh:mm:ss)"
          value={duration}
          editable={!isViewMode} // 🔒 lock in view mode
          onChangeText={setDuration}
        />
      </View>

      <Text style={styles.volumeText}>
        Total Volume: {totalVolume} kg
      </Text>

      {/* Exercises */}
      <Text style={styles.sectionTitle}>Exercises</Text>

      {exercises.map((ex) => {
        const isExpanded = expandedId === ex.id;
          return (
            <View key={ex.id} style={styles.exerciseCard}>

              {/* Header (click to expand) */}
              <TouchableOpacity onPress={() => toggleExpand(ex.id)}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  <TextInput
                    style={styles.remarkInput}
                    placeholder="Remark"
                    value={ex.remark}
                    editable={!isViewMode}
                    onChangeText={(text) => updateExercise(ex.id, "remark", text)}
                  />

                  <View style={styles.inputRow}>
                    <View style={styles.inputGroup}>
                      <Text>Weight</Text>
                      <TextInput
                        style={styles.inputSmall}
                        value={ex.weight}
                        editable={!isViewMode}
                        onChangeText={(text) => updateExercise(ex.id, "weight", text)}
                      />
              
                      {/* Only show in view mode */}
                      {isViewMode && (
                        <Text style={styles.lastValue}>
                          Last: {ex.lastWeight}
                        </Text>
                      )}
                    </View>

                    <View style={styles.inputGroup}>
                      <Text>Reps</Text>
                      <TextInput
                        style={styles.inputSmall}
                        value={ex.reps}
                        editable={!isViewMode}
                        onChangeText={(text) => updateExercise(ex.id, "reps", text)}
                      />
                      {isViewMode && (
                        <Text style={styles.lastValue}>
                          Last: {ex.lastReps}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
        );
      })}

      {/* Add Exercise button */}
      <TouchableOpacity style={styles.addButton} onPress={addExercise}>
        <Text style={styles.addButtonText}>+ Add Exercise</Text>
      </TouchableOpacity>

      {/* Finish Workout button */}
      {!isViewMode && (
        <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
          <Text style={styles.finishButtonText}>Finish Workout</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff", paddingTop: 30 },
  workoutName: { fontSize: 28, fontWeight: "700", marginBottom: 20 },
  volumeText: { fontSize: 18, fontWeight: "700", marginBottom: 20 },
  inputRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15 },
  input: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10, marginRight: 10 },
  sectionTitle: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  exerciseCard: { padding: 15, borderWidth: 1, borderColor: "#eee", borderRadius: 12, marginBottom: 15, backgroundColor: "#f7f7f7" },
  exerciseName: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  remarkInput: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 8, marginBottom: 10 },
  inputGroup: { flex: 1, marginRight: 10 },
  inputSmall: { borderWidth: 1, borderColor: "#ccc", borderRadius: 6, padding: 6, marginTop: 4, marginBottom: 2 },
  lastValue: { fontSize: 12, color: "#666" },
  addButton: { backgroundColor: "#007AFF", padding: 12, borderRadius: 8, alignItems: "center", marginBottom: 20 },
  addButtonText: { color: "#fff", fontWeight: "600" },
  finishButton: { backgroundColor: "#34C759", padding: 14, borderRadius: 8, alignItems: "center", marginBottom: 40 },
  finishButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

import { View, StyleSheet, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

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
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Title Row: back button + title — scrollable together */}
        <View style={styles.titleRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Palette.textPrimary} />
          </TouchableOpacity>
          <ThemedText type="displayLarge" style={styles.title}>{workoutName}</ThemedText>
        </View>

        {/* Date & Duration */}
        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <ThemedText type="caption" style={styles.inputLabel}>Date</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Palette.textSecondary}
              value={date}
              onChangeText={setDate}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText type="caption" style={styles.inputLabel}>Duration</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="hh:mm:ss"
              placeholderTextColor={Palette.textSecondary}
              value={duration}
              editable={!isViewMode}
              onChangeText={setDuration}
            />
          </View>
        </View>

        {/* Total volume stat */}
        <View style={styles.volumeCard}>
          <ThemedText type="caption" style={{ color: Palette.textSecondary }}>Total Volume</ThemedText>
          <ThemedText type="displaySmall">{totalVolume} kg</ThemedText>
        </View>

        {/* Exercises */}
        <ThemedText type="headingMedium" style={styles.sectionTitle}>Exercises</ThemedText>

        {exercises.map((ex) => {
          const isExpanded = expandedId === ex.id;
            return (
              <View key={ex.id} style={styles.exerciseCard}>
                {/* Header (click to expand) */}
                <TouchableOpacity onPress={() => toggleExpand(ex.id)} style={styles.exerciseHeader} activeOpacity={0.7}>
                  <ThemedText type="bodyLarge">{ex.name}</ThemedText>
                  <Ionicons 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={18} 
                    color={Palette.textSecondary} 
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <>
                    <TextInput
                      style={styles.remarkInput}
                      placeholder="Add a remark..."
                      placeholderTextColor={Palette.textSecondary}
                      value={ex.remark}
                      editable={!isViewMode}
                      onChangeText={(text) => updateExercise(ex.id, "remark", text)}
                    />

                    <View style={styles.inputRow}>
                      <View style={styles.inputGroup}>
                        <ThemedText type="caption" style={{ color: Palette.textSecondary }}>Weight</ThemedText>
                        <TextInput
                          style={styles.inputSmall}
                          value={ex.weight}
                          editable={!isViewMode}
                          placeholder="0"
                          placeholderTextColor={Palette.textSecondary}
                          onChangeText={(text) => updateExercise(ex.id, "weight", text)}
                        />
                        {isViewMode && (
                          <ThemedText type="caption" style={styles.lastValue}>
                            Last: {ex.lastWeight}
                          </ThemedText>
                        )}
                      </View>

                      <View style={styles.inputGroup}>
                        <ThemedText type="caption" style={{ color: Palette.textSecondary }}>Reps</ThemedText>
                        <TextInput
                          style={styles.inputSmall}
                          value={ex.reps}
                          editable={!isViewMode}
                          placeholder="0"
                          placeholderTextColor={Palette.textSecondary}
                          onChangeText={(text) => updateExercise(ex.id, "reps", text)}
                        />
                        {isViewMode && (
                          <ThemedText type="caption" style={styles.lastValue}>
                            Last: {ex.lastReps}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                  </>
                )}
              </View>
          );
        })}

        {/* Add Exercise button */}
        <TouchableOpacity style={styles.addButton} onPress={addExercise} activeOpacity={0.8}>
          <Ionicons name="add" size={18} color={Palette.accent} />
          <ThemedText type="bodyLarge" style={{ color: Palette.accent }}>Add Exercise</ThemedText>
        </TouchableOpacity>

        {/* Finish Workout button */}
        {!isViewMode && (
          <TouchableOpacity style={styles.finishButton} onPress={finishWorkout} activeOpacity={0.8}>
            <ThemedText style={styles.finishButtonText}>Finish Workout</ThemedText>
          </TouchableOpacity>
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
    paddingHorizontal: Spacing.xl,
    paddingTop: 56,
    paddingBottom: Spacing.xxxl,
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
  volumeCard: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.card,
  },
  inputRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  inputLabel: {
    color: Palette.textSecondary,
    marginBottom: 4,
    marginLeft: 2,
  },
  input: { 
    flex: 1, 
    borderWidth: 1.5, 
    borderColor: Palette.border, 
    borderRadius: Radius.md, 
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Palette.surface,
    color: Palette.textPrimary,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
  },
  sectionTitle: { 
    marginBottom: Spacing.lg,
    color: Palette.textPrimary,
  },
  exerciseCard: { 
    padding: Spacing.lg, 
    borderRadius: Radius.md, 
    marginBottom: Spacing.md, 
    backgroundColor: Palette.surface,
    ...Shadows.card,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  remarkInput: { 
    borderWidth: 1.5, 
    borderColor: Palette.border, 
    borderRadius: Radius.sm, 
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    color: Palette.textPrimary,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
  },
  inputGroup: { 
    flex: 1,
  },
  inputSmall: { 
    borderWidth: 1.5, 
    borderColor: Palette.border, 
    borderRadius: Radius.sm, 
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs, 
    marginBottom: Spacing.xs,
    color: Palette.textPrimary,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
    backgroundColor: Palette.surfaceAlt,
  },
  lastValue: { 
    color: Palette.textSecondary,
    marginTop: 2,
  },
  addButton: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md, 
    borderWidth: 1.5,
    borderColor: Palette.accent,
    borderStyle: 'dashed',
    marginBottom: Spacing.xl,
  },
  finishButton: { 
    backgroundColor: Palette.success, 
    padding: Spacing.lg, 
    borderRadius: Radius.md, 
    alignItems: "center", 
    marginBottom: Spacing.xxl,
    shadowColor: Palette.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  finishButtonText: { 
    color: Palette.textOnAccent, 
    fontWeight: "700", 
    fontSize: 17,
    fontFamily: Typography.bodyLarge.fontFamily,
  },
});

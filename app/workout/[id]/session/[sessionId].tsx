import { View, Text, StyleSheet, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function SessionDetail() {
  const { id, sessionId } = useLocalSearchParams();

  // Mock exercises — replace with DB data later
  const exercises = [
    {
      name: "Bench Press",
      sets: [
        { weight: 80, reps: 5 },
        { weight: 80, reps: 5 },
        { weight: 80, reps: 5 },
      ],
    },
    {
      name: "Incline Dumbbell Press",
      sets: [
        { weight: 30, reps: 10 },
        { weight: 30, reps: 10 },
      ],
    },
    {
      name: "Tricep Pushdown",
      sets: [
        { weight: 20, reps: 15 },
        { weight: 20, reps: 15 },
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Details</Text>
      <Text style={styles.subtitle}>Workout ID: {id}</Text>
      <Text style={styles.subtitle}>Session ID: {sessionId}</Text>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.name}
        contentContainerStyle={{ paddingVertical: 20 }}
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{item.name}</Text>

            {item.sets.map((set, index) => (
              <Text key={index} style={styles.setText}>
                Set {index + 1}: {set.weight}kg × {set.reps} reps
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  exerciseCard: {
    padding: 20,
    backgroundColor: "#f7f7f7",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },
  setText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 4,
  },
});

import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// Mock sessions (later you'll fetch from backend)
const mockSessions = [
  { id: "s1", date: "2024-02-01", volume: "12,400 kg" },
  { id: "s2", date: "2024-01-25", volume: "10,900 kg" },
  { id: "s3", date: "2024-01-10", volume: "11,300 kg" },
  { id: "s4", date: "2023-12-28", volume: "9,200 kg" },
];

export default function WorkoutDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const mockWorkout = {
    1: { title: "Push Day", desc: "Chest, Shoulders, Triceps" },
    2: { title: "Pull Day", desc: "Back, Biceps, Rear Delts" },
    3: { title: "Leg Day", desc: "Quads, Hamstrings, Glutes" },
  };

  const workout = mockWorkout[id];
  console.log("Workout ID:", id);

  // Only show the latest 3 for the "recent" list
  const recentSessions = mockSessions.slice(0, 3);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{workout?.title}</Text>
      <Text style={styles.desc}>{workout?.desc}</Text>

      {/* Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress</Text>
        <Text style={styles.placeholder}>📊 chart goes here</Text>
      </View>

      {/* Recent Sessions Header */}
      <View style={styles.sessionsHeader}>
        <TouchableOpacity>
          <Text style={styles.sortButton}>Sort ↓</Text>
        </TouchableOpacity>

        <TouchableOpacity 
        onPress={() => router.push(`/workout/${id}/sessions`)}
        >
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Sessions List */}
      <FlatList
        data={recentSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() => router.push(`/workout/${id}/session/${item.id}`)}
          >
            <Text style={styles.sessionDate}>{item.date}</Text>
            <Text style={styles.sessionVolume}>Volume: {item.volume}</Text>
          </TouchableOpacity>
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
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 10,
  },

  desc: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },

  section: {
    backgroundColor: "#f7f7f7",
    padding: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 25,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 10,
  },

  placeholder: {
    fontSize: 16,
    color: "#888",
  },

  sessionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 10,
  },

  sortButton: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },

  viewAll: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },

  sessionCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
  },

  sessionDate: {
    fontSize: 16,
    fontWeight: "700",
  },

  sessionVolume: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
});

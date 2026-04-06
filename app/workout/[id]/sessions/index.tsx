import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

// Mock session data
const mockSessions = [
  { id: "s1", date: "2024-02-01", volume: "12,400 kg" },
  { id: "s2", date: "2024-01-25", volume: "10,900 kg" },
  { id: "s3", date: "2024-01-10", volume: "11,300 kg" },
  { id: "s4", date: "2023-12-28", volume: "9,200 kg" },
];

export default function AllSessions() {
  const { id } = useLocalSearchParams(); // workout ID
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Sessions for Workout {id}</Text>

      <FlatList
        data={mockSessions}
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
  container: { flex: 1, padding: 20, backgroundColor: "#fff", paddingTop: 70 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  sessionCard: { padding: 16, borderRadius: 12, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#eee", marginBottom: 12 },
  sessionDate: { fontSize: 16, fontWeight: "700" },
  sessionVolume: { fontSize: 14, color: "#666", marginTop: 4 },
});

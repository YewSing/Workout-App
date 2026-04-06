import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const mockWorkouts = [
  { id: "1", title: "Push Day", description: "Chest, Shoulders, Triceps" },
  { id: "2", title: "Pull Day", description: "Back, Biceps, Rear Delts" },
  { id: "3", title: "Leg Day", description: "Quads, Hamstrings, Glutes" },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Your Workouts</Text>

      <FlatList
        data={mockWorkouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          // <TouchableOpacity 
          //   style={styles.card}
          //   onPress={() => router.push(`/workout/${item.id}`)} 
          // >

          //   <Text style={styles.cardTitle}>{item.title}</Text>
          //   <Text style={styles.cardDesc}>{item.description}</Text>
          // </TouchableOpacity>

          <View style={styles.card}>
            {/* Left side: title + description */}
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc}>{item.description}</Text>
            </View>

            {/* Right side: + Session button */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push(`/workout/create`)} // navigate to create session
            >
              <Text style={styles.addButtonText}>+ Session</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 40 }}
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

  header: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },

  card: {
    flexDirection: "row", // make horizontal layout
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    padding: 20,
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#eee",
  },

  cardText: {
    flex: 1, // take all remaining space
    paddingRight: 10,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 6,
  },

  cardDesc: {
    fontSize: 14,
    color: "#666",
  },

  addButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  addButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

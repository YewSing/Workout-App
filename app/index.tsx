import { Link } from "expo-router";
import { View, Text, Button } from "react-native";

export default function Home() {
  return (
    <View style={{ padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>My Workout App</Text>

      <Link href="/login">
        <Text style={{ color: "blue", marginBottom: 10 }}>Login</Text>
      </Link>

      <Link href="/register">
        <Text style={{ color: "blue" }}>Register</Text>
      </Link>
    </View>
  );
}

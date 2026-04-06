import { Link } from "expo-router";
import { StyleSheet, View, ImageBackground, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";

export default function WelcomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Top Section: Branding & Motivation */}
      <View style={styles.headerSection}>
        <ThemedText type="title" style={styles.brandName}>
          My Gym
        </ThemedText>
        <ThemedText style={styles.tagline}>
          Sculpt your body. Track your progress.
        </ThemedText>
      </View>

      {/* Middle Section: Visual Aesthetic (Optional Placeholder) */}
      <View style={styles.visualSection}>
        <View style={styles.accentCircle} />
      </View>

      {/* Bottom Section: Auth Actions */}
      <View style={styles.footerSection}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.primaryButton}>
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </Link>

        <Link href="/register" asChild style={styles.secondaryLink}>
          <TouchableOpacity>
            <ThemedText type="defaultSemiBold">
              New here? <ThemedText type="link">Create an account</ThemedText>
            </ThemedText>
          </TouchableOpacity>
        </Link>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  headerSection: {
    marginTop: 80,
    alignItems: "center",
  },
  brandName: {
    fontSize: 42,
    letterSpacing: 4,
    fontWeight: "900",
  },
  tagline: {
    opacity: 0.7,
    marginTop: 8,
    textAlign: "center",
  },
  visualSection: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  accentCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: "#007AFF",
    opacity: 0.1,
    position: "absolute",
  },
  footerSection: {
    marginBottom: 40,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: "#007AFF", // Using a standard blue, but you can use useThemeColor hook
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryLink: {
    alignItems: "center",
    marginTop: 8,
  },
});
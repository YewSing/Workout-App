import { Link } from "expo-router";
import { StyleSheet, View, TouchableOpacity } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

export default function WelcomeScreen() {
  return (
    <ThemedView style={styles.container}>
      {/* Top Section: Branding & Motivation */}
      <View style={styles.headerSection}>
        <ThemedText type="displayLarge" style={styles.brandName}>
          My Gym
        </ThemedText>
        <ThemedText type="bodyDefault" style={styles.tagline}>
          Sculpt your body. Track your progress.
        </ThemedText>
      </View>

      {/* Middle Section: Visual Aesthetic */}
      <View style={styles.visualSection}>
        <View style={styles.accentCircle} />
      </View>

      {/* Bottom Section: Auth Actions */}
      <View style={styles.footerSection}>
        <Link href="/login" asChild>
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8}>
            <ThemedText style={styles.primaryButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </Link>

        <Link href="/register" asChild style={styles.secondaryLink}>
          <TouchableOpacity>
            <ThemedText type="bodyDefault">
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
    padding: Spacing.xl,
    justifyContent: "space-between",
    backgroundColor: Palette.background,
  },
  headerSection: {
    marginTop: 80,
    alignItems: "center",
  },
  brandName: {
    fontSize: 42,
    letterSpacing: 4,
  },
  tagline: {
    color: Palette.textSecondary,
    marginTop: Spacing.sm,
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
    backgroundColor: Palette.accent,
    opacity: 0.12,
    position: "absolute",
  },
  footerSection: {
    marginBottom: 40,
    gap: Spacing.lg,
  },
  primaryButton: {
    backgroundColor: Palette.accent,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: "center",
    ...Shadows.button,
  },
  primaryButtonText: {
    color: Palette.textOnAccent,
    fontSize: 18,
    fontWeight: "700",
  },
  secondaryLink: {
    alignItems: "center",
    marginTop: Spacing.sm,
  },
});
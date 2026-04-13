import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

export default function WorkoutScreen() {
  const router = useRouter();

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <ThemedText type="displayLarge">Workouts</ThemedText>
          <ThemedText type="bodySmall" style={styles.subtitle}>Programs & Templates</ThemedText>
        </View>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/workout/create')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="barbell-outline" size={24} color={Palette.accent} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="bodyLarge">Start Empty Workout</ThemedText>
            <ThemedText type="caption" style={styles.cardSubtext}>Log an impromptu session</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Palette.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => router.push('/workout/new-template')}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={24} color={Palette.accent} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="bodyLarge">New Routine</ThemedText>
            <ThemedText type="caption" style={styles.cardSubtext}>Create a reusable template</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Palette.textSecondary} />
        </TouchableOpacity>

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
    padding: Spacing.xl,
    paddingTop: 64,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  subtitle: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: Palette.accentLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  cardInfo: {
    flex: 1,
  },
  cardSubtext: {
    color: Palette.textSecondary,
    marginTop: Spacing.xs,
  },
});

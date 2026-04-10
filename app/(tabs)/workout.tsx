import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function WorkoutScreen() {
  const router = useRouter();
  const cardBackground = useThemeColor({ light: '#F5F5F7', dark: '#1C1C1E' }, 'background');
  const accentColor = '#007AFF';

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <ThemedText type="title">Workouts</ThemedText>
          <ThemedText style={styles.subtitle}>Programs & Templates</ThemedText>
        </View>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardBackground }]} 
          onPress={() => router.push('/workout/create')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="barbell-outline" size={24} color={accentColor} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="defaultSemiBold">Start Empty Workout</ThemedText>
            <ThemedText style={styles.cardSubtext}>Log an impromptu session</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionCard, { backgroundColor: cardBackground }]} 
          onPress={() => router.push('/workout/new-template')}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="document-text-outline" size={24} color={accentColor} />
          </View>
          <View style={styles.cardInfo}>
            <ThemedText type="defaultSemiBold">New Routine</ThemedText>
            <ThemedText style={styles.cardSubtext}>Create a reusable template</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
        </TouchableOpacity>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  subtitle: {
    opacity: 0.6,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(7, 127, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardInfo: {
    flex: 1,
  },
  cardSubtext: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 4,
  },
});

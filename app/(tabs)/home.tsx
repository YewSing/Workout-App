import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const cardBackground = useThemeColor({ light: '#F5F5F7', dark: '#F5F5F7' }, 'background');
  const accentColor = '#007AFF';

  // Hardcoded exercises for the redirection cards
  const userExercises = [
    { id: '1', name: 'Lat Pulldowns', target: 'Back Width', icon: 'figure.back.strength' },
    { id: '2', name: 'Lateral Raises', target: 'Shoulder Fullness', icon: 'figure.arms.open' },
    { id: '3', name: 'Incline Bench', target: 'Upper Chest', icon: 'figure.strengthtraining' },
    { id: '4', name: 'Face Pulls', target: 'Rear Delts', icon: 'figure.mixed.cardio' },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Tracking your V-Shape progress</ThemedText>
        </View>

        {/* Section 1: Analytics Graph Card */}
        <ThemedView style={[styles.analyticsCard, { backgroundColor: cardBackground }]}>
          <View style={styles.cardHeader}>
            <ThemedText type="defaultSemiBold">Weekly Volume</ThemedText>
            <ThemedText style={{ color: accentColor, fontSize: 12 }}>+12% from last week</ThemedText>
          </View>
          
          {/* Visual representation of a graph */}
          <View style={styles.graphContainer}>
            {[40, 70, 45, 90, 65, 80, 100].map((height, index) => (
              <View key={index} style={styles.graphBarContainer}>
                <View style={[styles.graphBar, { height: height, backgroundColor: accentColor }]} />
                <ThemedText style={styles.graphLabel}>{['M', 'T', 'W', 'T', 'R', 'F', 'S'][index]}</ThemedText>
              </View>
            ))}
          </View>
        </ThemedView>

        {/* Section 2: Exercise Redirection Cards */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">My Exercises</ThemedText>
          <TouchableOpacity onPress={() => router.push('/workout/create')}>
            <ThemedText type="link">View All</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.cardGrid}>
          {userExercises.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.exerciseCard, { backgroundColor: cardBackground }]}
              onPress={() => router.push(`/workout/${item.id}`)}
            >
              <View style={styles.iconCircle}>
                <IconSymbol name={item.icon as any} size={24} color={accentColor} />
              </View>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
              <ThemedText style={styles.targetText}>{item.target}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

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
    marginBottom: 24,
  },
  subtitle: {
    opacity: 0.6,
  },
  analyticsCard: {
    padding: 20,
    borderRadius: 20,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
  },
  graphBarContainer: {
    alignItems: 'center',
    flex: 1,
  },
  graphBar: {
    width: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  graphLabel: {
    fontSize: 10,
    opacity: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  exerciseCard: {
    width: (width - 64) / 2, // 2-column grid calculation
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 127, 255, 0.34)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  targetText: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
});
import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Ionicons } from '@expo/vector-icons';
import { fetchWorkouts, deleteWorkoutTemplate } from '@/api/workout';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const cardBackground = useThemeColor({ light: '#F5F5F7', dark: '#F5F5F7' }, 'background');
  const accentColor = '#007AFF';

  const [workouts, setWorkouts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const loadWorkouts = async () => {
    try {
      const data = await fetchWorkouts();
      if (data && data.$values) {
        setWorkouts(data.$values);
      } else if (Array.isArray(data)) {
        setWorkouts(data);
      }
    } catch (err) {
      console.log("Error loading workouts", err);
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, []);

  const handleMoreActions = (id: string) => {
    setSelectedWorkoutId(id);
    setModalVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedWorkoutId) return;

    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await deleteWorkoutTemplate(selectedWorkoutId);
              setModalVisible(false);
              loadWorkouts();
            } catch (err) {
              Alert.alert("Error", "Could not delete template");
            }
          }
        }
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Header Section */}
        <View style={styles.header}>
          <ThemedText type="title">Dashboard</ThemedText>
          <ThemedText style={styles.subtitle}>Tracking your progress</ThemedText>
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

        {/* Section 2: Workout Redirection Cards */}
        <View style={styles.sectionHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ThemedText type="subtitle">My Templates</ThemedText>
            
            <TouchableOpacity 
              onPress={() => router.push('/workout/new-template')}
              style={styles.addButtonSmall}
            >
              <Ionicons name="add-circle" size={24} color={accentColor} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(tabs)/workout')}>
            <ThemedText type="link">View All</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.cardGrid}>
          {workouts.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.exerciseCard, { backgroundColor: cardBackground }]}
              onPress={() => router.push(`/workout/${item.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.iconCircle}>
                  <IconSymbol name="fitness.center" size={24} color={accentColor} />
                </View>
                <TouchableOpacity 
                  style={styles.moreActionButton}
                  onPress={() => handleMoreActions(item.id)}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                >
                  <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
                </TouchableOpacity>
              </View>
              <ThemedText type="defaultSemiBold" numberOfLines={1}>{item.name}</ThemedText>
              <ThemedText style={styles.targetText}>{item.description || 'No description'}</ThemedText>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Action Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={styles.actionSheetContainer}>
            <View style={styles.dragIndicator} />
            <ThemedText style={styles.sheetTitle}>Template Actions</ThemedText>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Duplicate template feature")}>
              <Ionicons name="copy-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Duplicate Template</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Pin to Top feature")}>
              <Ionicons name="star-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Pin to Top</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionItem} onPress={() => Alert.alert("Coming Soon", "Share feature")}>
              <Ionicons name="share-outline" size={22} color="#000" />
              <ThemedText style={styles.actionText}>Share Template</ThemedText>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity style={[styles.actionItem, styles.destructiveAction]} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
              <ThemedText style={[styles.actionText, { color: '#FF3B30' }]}>Delete Template</ThemedText>
            </TouchableOpacity>
            
          </View>
        </TouchableOpacity>
      </Modal>
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
    width: (width - 64) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'flex-start',
  },
  cardTopRow: {
    flexDirection: 'row', 
    width: '100%', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 12
  },
  moreActionButton: {
    padding: 4,
  },
  addButtonSmall: {
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: '#fff', 
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20, 
    padding: 24, 
    paddingBottom: 40,
  },
  dragIndicator: {
    width: 40, 
    height: 5, 
    backgroundColor: '#DDDDDD', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 16, 
    opacity: 0.5
  },
  actionItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    gap: 12
  },
  actionText: {
    fontSize: 16, 
    color: '#000'
  },
  divider: {
    height: 1, 
    backgroundColor: '#EEE', 
    marginVertical: 8
  },
  destructiveAction: {
    marginTop: 8
  }
});
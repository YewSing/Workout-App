import React, { useState } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';
import { createExercise } from '@/api/workout';

const MUSCLE_GROUPS = ['Chest', 'Back', 'Shoulders', 'Legs', 'Biceps', 'Triceps', 'Core'];

export default function NewExerciseScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow access to your photo library to add a photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter an exercise name.');
      return;
    }
    if (!muscleGroup) {
      Alert.alert('Muscle group required', 'Please select a muscle group.');
      return;
    }
    try {
      setSaving(true);
      await createExercise(name.trim(), muscleGroup, undefined, photoUri ?? undefined);
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save the exercise. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={Palette.textPrimary} />
        </TouchableOpacity>
        <ThemedText type="headingMedium">New Exercise</ThemedText>
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && { opacity: 0.6 }]}
          activeOpacity={0.8}
        >
          {saving
            ? <ActivityIndicator size="small" color={Palette.textOnAccent} />
            : <ThemedText style={styles.saveButtonText}>Save</ThemedText>
          }
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* Photo picker */}
        <TouchableOpacity style={styles.photoPicker} onPress={pickImage} activeOpacity={0.8}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera-outline" size={32} color={Palette.textSecondary} />
              <ThemedText type="caption" style={styles.photoPlaceholderText}>Add Photo</ThemedText>
            </View>
          )}
        </TouchableOpacity>

        {/* Name */}
        <View style={styles.field}>
          <ThemedText type="label" style={styles.label}>EXERCISE NAME *</ThemedText>
          <TextInput
            style={styles.input}
            placeholder="e.g., Incline Dumbbell Press"
            placeholderTextColor={Palette.textSecondary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        {/* Muscle Group */}
        <View style={styles.field}>
          <ThemedText type="label" style={styles.label}>MUSCLE GROUP *</ThemedText>
          <View style={styles.chipRow}>
            {MUSCLE_GROUPS.map(g => (
              <TouchableOpacity
                key={g}
                style={[styles.chip, muscleGroup === g && styles.chipSelected]}
                onPress={() => setMuscleGroup(g)}
                activeOpacity={0.75}
              >
                <ThemedText style={[styles.chipText, muscleGroup === g && styles.chipTextSelected]}>
                  {g}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.md,
    backgroundColor: Palette.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    ...Shadows.card,
  },
  saveButton: {
    marginLeft: 'auto',
    backgroundColor: Palette.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
    minWidth: 64,
    alignItems: 'center',
  },
  saveButtonText: {
    color: Palette.textOnAccent,
    fontWeight: '700',
    fontSize: 15,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: 60,
  },
  photoPicker: {
    alignSelf: 'center',
    marginBottom: Spacing.xl,
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: Radius.xl,
    backgroundColor: Palette.surface,
    borderWidth: 2,
    borderColor: Palette.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  photoPlaceholderText: {
    color: Palette.textSecondary,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    color: Palette.textSecondary,
    marginBottom: Spacing.sm,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: Palette.textPrimary,
    borderWidth: 1,
    borderColor: Palette.border,
    ...Shadows.card,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  chipSelected: {
    backgroundColor: Palette.accentLight,
    borderColor: Palette.accent,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Palette.textSecondary,
  },
  chipTextSelected: {
    color: Palette.accent,
    fontWeight: '700',
  },
});

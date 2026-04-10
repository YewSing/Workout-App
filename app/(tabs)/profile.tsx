import React from 'react';
import { StyleSheet, View, Image, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '@/api/auth';

export default function ProfileScreen() {
  const router = useRouter();
  const cardBackground = useThemeColor({ light: '#F5F5F7', dark: '#1C1C1E' }, 'background');

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      Alert.alert('Logout failed', 'An error occurred while logging out.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: handleLogout },
      ]
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color="#888" />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="defaultSemiBold" style={styles.name}>Athlete</ThemedText>
          <ThemedText style={styles.email}>user@example.com</ThemedText>
        </View>
      </View>

      <View style={styles.settingsSection}>
        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBackground }]}>
          <View style={styles.settingLeft}>
            <Ionicons name="settings-outline" size={24} color="#888" />
            <ThemedText style={styles.settingText}>Account Settings</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBackground }]}>
          <View style={styles.settingLeft}>
            <Ionicons name="notifications-outline" size={24} color="#888" />
            <ThemedText style={styles.settingText}>Notifications</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.settingItem, { backgroundColor: cardBackground }]} onPress={() => Alert.alert('Coming Soon', 'Trash / Deleted Templates recovery will be here.')}>
          <View style={styles.settingLeft}>
            <Ionicons name="trash-bin-outline" size={24} color="#888" />
            <ThemedText style={styles.settingText}>Deleted Templates</ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
        <ThemedText style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    opacity: 0.6,
  },
  settingsSection: {
    gap: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 16,
    gap: 8,
    marginBottom: 20,
  },
  logoutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});

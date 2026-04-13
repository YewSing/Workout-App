import React from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '@/api/auth';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();

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

  const settingsItems = [
    { icon: 'settings-outline' as const, label: 'Account Settings', onPress: () => {} },
    { icon: 'notifications-outline' as const, label: 'Notifications', onPress: () => {} },
    { icon: 'trash-bin-outline' as const, label: 'Deleted Templates', onPress: () => Alert.alert('Coming Soon', 'Trash / Deleted Templates recovery will be here.') },
  ];

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="displayLarge">Profile</ThemedText>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person" size={40} color={Palette.textSecondary} />
        </View>
        <View style={styles.profileInfo}>
          <ThemedText type="displaySmall" style={styles.name}>Athlete</ThemedText>
          <ThemedText type="bodySmall" style={styles.email}>user@example.com</ThemedText>
        </View>
      </View>

      <View style={styles.settingsSection}>
        {settingsItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={item.onPress}
            activeOpacity={0.8}
          >
            <View style={styles.settingLeft}>
              <View style={styles.settingIconCircle}>
                <Ionicons name={item.icon} size={20} color={Palette.textSecondary} />
              </View>
              <ThemedText type="bodyDefault">{item.label}</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Palette.textSecondary} />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ flex: 1 }} />

      <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={Palette.danger} />
        <ThemedText type="bodyLarge" style={styles.logoutText}>Log Out</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
    padding: Spacing.xl,
    paddingTop: 64,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xxl + Spacing.sm,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    ...Shadows.card,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    marginBottom: Spacing.xs,
  },
  email: {
    color: Palette.textSecondary,
  },
  settingsSection: {
    gap: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.surface,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    ...Shadows.card,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: Palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    backgroundColor: Palette.dangerLight,
    borderRadius: Radius.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    color: Palette.danger,
  },
});

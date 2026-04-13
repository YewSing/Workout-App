import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { register } from "../api/auth";
import { Alert } from 'react-native';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const handleRegister = async () => {
    try {
      console.log("Registering")
      await register(email, password, username);

      Alert.alert("Success", "Account created!");
      router.push("/login");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <ThemedText type="displayLarge" style={styles.title}>Start Your Journey</ThemedText>
            <ThemedText type="bodyDefault" style={styles.subtitle}>Build your V-shape physique today.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="bodySmall" style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={Palette.textSecondary}
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="bodySmall" style={styles.label}>Email</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="name@example.com"
                placeholderTextColor={Palette.textSecondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="bodySmall" style={styles.label}>Password</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Min. 8 characters"
                placeholderTextColor={Palette.textSecondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="bodySmall" style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Repeat password"
                placeholderTextColor={Palette.textSecondary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister} activeOpacity={0.8}>
              <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText type="bodyDefault">Already have an account? </ThemedText>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <ThemedText type="link">Sign In</ThemedText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Palette.background,
  },
  scrollContent: {
    paddingVertical: 64,
    justifyContent: 'center',
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Palette.textSecondary,
  },
  form: {
    gap: Spacing.lg + Spacing.xs,
  },
  inputGroup: {
    gap: Spacing.sm,
  },
  label: {
    color: Palette.textSecondary,
  },
  input: {
    height: 52,
    borderWidth: 1.5,
    borderColor: Palette.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
    color: Palette.textPrimary,
    backgroundColor: Palette.surface,
  },
  registerButton: {
    backgroundColor: Palette.accent,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.button,
  },
  registerButtonText: {
    color: Palette.textOnAccent,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bodyLarge.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
});
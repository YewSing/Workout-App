import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Alert } from 'react-native';
import { login } from '@/api/auth';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      const message = error.response?.data?.message || "Login failed. Please try again.";
      Alert.alert("Login Error", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="displayLarge" style={styles.title}>Welcome Back</ThemedText>
          <ThemedText type="bodyDefault" style={styles.subtitle}>Enter your details to continue your gains.</ThemedText>
        </View>

        <View style={styles.form}>
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
              placeholder="••••••••"
              placeholderTextColor={Palette.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.8}>
            <ThemedText style={styles.loginButtonText}>Sign In</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <ThemedText type="bodyDefault">Don't have an account? </ThemedText>
          <TouchableOpacity onPress={() => router.push('/register')}>
            <ThemedText type="link">Sign Up</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
    backgroundColor: Palette.background,
  },
  header: {
    marginBottom: Spacing.xxl + Spacing.sm,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  subtitle: {
    color: Palette.textSecondary,
  },
  form: {
    gap: Spacing.xl,
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
  loginButton: {
    backgroundColor: Palette.accent,
    height: 52,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.button,
  },
  loginButtonText: {
    color: Palette.textOnAccent,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bodyLarge.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl + Spacing.sm,
  },
});
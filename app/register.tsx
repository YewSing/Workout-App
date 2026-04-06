import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { register } from "../api/auth";
import { Alert } from 'react-native';

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#E0E0E0', dark: '#333' }, 'tabIconDefault');

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
            <ThemedText type="title" style={styles.title}>Start Your Journey</ThemedText>
            <ThemedText style={styles.subtitle}>Build your V-shape physique today.</ThemedText>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Full Name</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: borderColor }]}
                placeholder="John Doe"
                placeholderTextColor="#888"
                value={username}
                onChangeText={setUsername}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Email</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: borderColor }]}
                placeholder="name@example.com"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Password</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: borderColor }]}
                placeholder="Min. 8 characters"
                placeholderTextColor="#888"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText type="defaultSemiBold" style={styles.label}>Confirm Password</ThemedText>
              <TextInput
                style={[styles.input, { color: textColor, borderColor: borderColor }]}
                placeholder="Repeat password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.registerButton} onPress={handleRegister}>
              <ThemedText style={styles.registerButtonText}>Create Account</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText>Already have an account? </ThemedText>
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
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingVertical: 60,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: 16,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#007AFF',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  registerButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
});
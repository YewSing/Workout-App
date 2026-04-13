import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Typography } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface AppInputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  showClear?: boolean;
  onClear?: () => void;
}

export function AppInput({
  label,
  error,
  containerStyle,
  showClear,
  onClear,
  style,
  value,
  ...rest
}: AppInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <ThemedText type="bodySmall" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Palette.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          {...rest}
        />
        {showClear && value && value.length > 0 && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color={Palette.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <ThemedText type="caption" style={styles.errorText}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  label: {
    color: Palette.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Palette.border,
  },
  inputFocused: {
    borderColor: Palette.accent,
  },
  inputError: {
    borderColor: Palette.danger,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: Typography.bodyDefault.fontSize,
    fontFamily: Typography.bodyDefault.fontFamily,
    color: Palette.textPrimary,
  },
  clearButton: {
    paddingHorizontal: Spacing.md,
  },
  errorText: {
    color: Palette.danger,
  },
});

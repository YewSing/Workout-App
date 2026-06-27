import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Shadows } from '@/constants/theme';

const PR_GOLD = '#F5A623';
const TOAST_DURATION_MS = 3000;

interface SessionToastContextValue {
  showSessionRunningToast: () => void;
  hideSessionRunningToast: () => void;
}

const SessionToastContext = createContext<SessionToastContextValue | null>(null);

// Renders above whatever screen is currently focused, so it survives the
// navigation that happens right after the user presses back.
export function SessionToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideSessionRunningToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 16, duration: 200, useNativeDriver: true }),
    ]).start(() => setVisible(false));
  }, [opacity, translateY]);

  const showSessionRunningToast = useCallback(() => {
    setVisible(true);
    opacity.setValue(0);
    translateY.setValue(16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(hideSessionRunningToast, TOAST_DURATION_MS);
  }, [opacity, translateY, hideSessionRunningToast]);

  return (
    <SessionToastContext.Provider value={{ showSessionRunningToast, hideSessionRunningToast }}>
      {children}
      {visible && (
        <View style={styles.overlay} pointerEvents="none">
          <Animated.View style={[styles.toast, { opacity, transform: [{ translateY }] }]}>
            <Ionicons name="time-outline" size={16} color={PR_GOLD} />
            <ThemedText style={styles.text}>Your workout session is still running</ThemedText>
          </Animated.View>
        </View>
      )}
    </SessionToastContext.Provider>
  );
}

export function useSessionToast() {
  const ctx = useContext(SessionToastContext);
  if (!ctx) throw new Error('useSessionToast must be used within a SessionToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    bottom: 95, // sits just above the Finish Workout button on the active session page
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.textPrimary,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    maxWidth: '88%',
    ...Shadows.cardHover,
  },
  text: {
    color: Palette.textOnAccent,
    fontSize: 13,
    fontWeight: '600',
  },
});

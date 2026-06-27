import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing, Radius, Shadows, TabBar } from '@/constants/theme';
import { useActiveWorkout } from '@/contexts/active-workout';

// Screens where either there's nothing useful to jump back to (auth), the user is
// already looking at the session this bar would take them to, or the screen has
// its own Start/Continue Workout button so the bar would be redundant and would
// sit right on top of it (every one of these routes ends in a footer button of
// its own — see each screen's `footer` style).
const HIDDEN_ROUTES = ['/workout/create', '/login', '/register', '/'];
const STATIC_WORKOUT_ROUTES = new Set(['/workout/create', '/workout/new-template', '/workout/new-exercise']);

// True for the plan detail screen (app/workout/[id]/index.tsx), e.g. "/workout/5" —
// but not its sub-routes like "/workout/5/sessions" or "/workout/5/session/12",
// and not the other static "/workout/*" screens which share the same segment count.
const isPlanDetailRoute = (pathname: string) =>
  pathname.startsWith('/workout/') && pathname.split('/').length === 3 && !STATIC_WORKOUT_ROUTES.has(pathname);

const formatClock = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

// Floating shortcut back into an in-progress workout draft, visible from anywhere
// in the app. Without this, leaving the live session screen (back button, swipe,
// hardware back) left no way back to it except retracing Home > Plan > Start Workout.
export function ActiveWorkoutBar() {
  const { activeWorkout } = useActiveWorkout();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const tick = () => setElapsed(Math.floor((Date.now() - activeWorkout.startTime) / 1000));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [activeWorkout]);

  if (!activeWorkout || HIDDEN_ROUTES.includes(pathname) || isPlanDetailRoute(pathname)) return null;

  // Fixed regardless of route (tab screen or not) so the bar never jumps to a
  // different height as the user navigates — it always sits the same distance
  // above the safe area, as if a tab bar were there even on screens that don't
  // show one.
  const bottom = TabBar.height + insets.bottom;

  return (
    <TouchableOpacity
      style={[styles.bar, { bottom }]}
      activeOpacity={0.85}
      onPress={() => router.push({
        pathname: '/workout/create',
        params: {
          variationId: activeWorkout.variationId,
          planName: activeWorkout.planName,
          gymName: activeWorkout.gymName,
        },
      } as any)}
    >
      <View style={styles.pulseDot} />
      <View style={{ flex: 1 }}>
        <ThemedText type="bodySmall" style={styles.title} numberOfLines={1}>
          {activeWorkout.gymName || activeWorkout.planName || 'Workout in progress'}
        </ThemedText>
        <ThemedText type="caption" style={styles.subtitle}>Tap to continue</ThemedText>
      </View>
      <ThemedText style={styles.timer}>{formatClock(elapsed)}</ThemedText>
      <Ionicons name="chevron-forward" size={18} color={Palette.textOnAccent} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.accent,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
    zIndex: 998,
    ...Shadows.cardHover,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.textOnAccent,
  },
  title: {
    color: Palette.textOnAccent,
    fontWeight: '700',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.75)',
  },
  timer: {
    color: Palette.textOnAccent,
    fontWeight: '700',
    fontSize: 14,
  },
});

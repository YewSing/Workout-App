import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DRAFT_KEY_PREFIX = 'workout_draft_';
// Mirrors the staleness cutoff app/workout/create.tsx uses when deciding whether
// to resume a saved draft, so a context entry never outlives the draft it points to.
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface ActiveWorkoutInfo {
  variationId: string;
  planName: string;
  gymName: string;
  startTime: number;
}

interface ActiveWorkoutContextValue {
  activeWorkout: ActiveWorkoutInfo | null;
  setActiveWorkout: (info: ActiveWorkoutInfo) => void;
  clearActiveWorkout: (variationId: string) => void;
  discardActiveWorkout: () => Promise<void>;
}

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

// There's no backend notion of an "in-progress" session — a workout only becomes a
// real Session row once Finish is tapped (see api/session.ts). Until then it's just
// an AsyncStorage draft written by app/workout/create.tsx. This provider mirrors that
// draft's identity in memory so the rest of the app (a persistent nav shortcut, the
// plan detail screen's button label) can react to it without re-reading storage.
export function ActiveWorkoutProvider({ children }: { children: ReactNode }) {
  const [activeWorkout, setActiveWorkoutState] = useState<ActiveWorkoutInfo | null>(null);

  // One-time recovery on cold start — covers the case where the app was killed
  // while a workout was in progress, before any screen has had a chance to call
  // setActiveWorkout itself.
  useEffect(() => {
    (async () => {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const draftKeys = keys.filter(k => k.startsWith(DRAFT_KEY_PREFIX));
        if (draftKeys.length === 0) return;

        const entries = await AsyncStorage.multiGet(draftKeys);
        let best: ActiveWorkoutInfo | null = null;
        for (const [key, value] of entries) {
          if (!value) continue;
          try {
            const draft = JSON.parse(value);
            if (Date.now() - draft.startTime >= DRAFT_MAX_AGE_MS) continue;
            if (!Array.isArray(draft.exercises) || draft.exercises.length === 0) continue;
            const candidate: ActiveWorkoutInfo = {
              variationId: key.slice(DRAFT_KEY_PREFIX.length),
              planName: draft.planName ?? '',
              gymName: draft.gymName ?? '',
              startTime: draft.startTime,
            };
            if (!best || candidate.startTime > best.startTime) best = candidate;
          } catch {}
        }
        if (best) setActiveWorkoutState(best);
      } catch {}
    })();
  }, []);

  const setActiveWorkout = useCallback((info: ActiveWorkoutInfo) => {
    setActiveWorkoutState(info);
  }, []);

  const clearActiveWorkout = useCallback((variationId: string) => {
    setActiveWorkoutState(prev => (prev?.variationId === variationId ? null : prev));
  }, []);

  // Used by the "discard the other workout and start this one" conflict resolution —
  // removes the draft this context doesn't itself own a reference to elsewhere.
  const discardActiveWorkout = useCallback(async () => {
    setActiveWorkoutState(prev => {
      if (prev) AsyncStorage.removeItem(`${DRAFT_KEY_PREFIX}${prev.variationId}`).catch(() => {});
      return null;
    });
  }, []);

  return (
    <ActiveWorkoutContext.Provider value={{ activeWorkout, setActiveWorkout, clearActiveWorkout, discardActiveWorkout }}>
      {children}
    </ActiveWorkoutContext.Provider>
  );
}

export function useActiveWorkout() {
  const ctx = useContext(ActiveWorkoutContext);
  if (!ctx) throw new Error('useActiveWorkout must be used within an ActiveWorkoutProvider');
  return ctx;
}

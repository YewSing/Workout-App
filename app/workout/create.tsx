import {
  View, StyleSheet, TextInput, TouchableOpacity, Animated,
  Platform, UIManager, ActivityIndicator, Alert, Modal, FlatList, ScrollView,
} from "react-native";
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { useLocalSearchParams, useRouter, useNavigation } from "expo-router";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FilterChip } from '@/components/ui/FilterChip';
import { Palette, Spacing, Radius, Shadows, Typography } from '@/constants/theme';
import { useSessionToast } from '@/contexts/session-toast';
import { createSession, addExerciseToSession, addSet as apiAddSet, finishSession, getLastSessionForVariation } from '@/api/session';
import { fetchAllExercises } from '@/api/workout';

const muscleGroupsMapping: Record<string, string[]> = {
  'Chest': ['chest', 'upper chest', 'lower chest', 'mid chest', 'pectorals', 'pecs'],
  'Back': ['back', 'lats', 'upper back', 'lower back', 'rhomboids', 'traps'],
  'Shoulder': ['shoulder', 'front delt', 'side delt', 'rear delt', 'delts', 'deltoids', 'shoulders'],
  'Legs': ['legs', 'quads', 'hamstrings', 'hamstring', 'calf', 'calves', 'glutes'],
  'Biceps': ['biceps', 'bicep'],
  'Triceps': ['triceps', 'tricep'],
  'Core': ['core', 'abs', 'abdominals', 'obliques'],
};

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

const PR_GOLD = '#F5A623';
const DEFAULT_REST_SECONDS = 90;

const formatNumber = (num: number) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatClock = (totalSeconds: number) => {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
};

const haptic = (type: 'light' | 'success' | 'select' = 'light') => {
  try {
    if (type === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === 'select') Haptics.selectionAsync();
    else Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
};

interface SetItem {
  id: string;
  prevWeight: number | null;
  prevReps: number | null;
  weight: string;
  reps: string;
  done: boolean;
}

interface ExItem {
  key: string;
  exerciseId: number;
  name: string;
  muscleGroup?: string;
  note: string;
  sets: SetItem[];
}

interface ExerciseEntry { id: number; name: string; muscleGroup: string; }

const SetRow = ({ set, isPR, onUpdate, onCopyPrev, canRemove, onRemove }: any) => {
  const [wFocus, setWFocus] = useState(false);
  const [rFocus, setRFocus] = useState(false);
  const hasPrev = set.prevWeight != null && set.prevReps != null;

  return (
    <View style={[styles.tableRow, set.done && styles.tableRowDone]}>
      <View style={[styles.tableCol, { flex: 0.5 }]}>
        {set.done && isPR ? (
          <ThemedText style={{ fontSize: 16 }}>🏆</ThemedText>
        ) : (
          <View style={styles.setNumberBadge}>
            <ThemedText type="bodySmall">{set.setNumber}</ThemedText>
          </View>
        )}
      </View>

      {/* Previous — tap to copy into kg/reps */}
      <TouchableOpacity
        style={[styles.tableCol, { flex: 1.5, flexDirection: 'row', gap: 4 }]}
        onPress={hasPrev ? onCopyPrev : undefined}
        disabled={!hasPrev}
        activeOpacity={0.6}
      >
        {hasPrev ? (
          <>
            <ThemedText type="caption" style={{ color: Palette.textSecondary }}>
              {set.prevWeight}×{set.prevReps}
            </ThemedText>
            <Ionicons name="arrow-forward-circle" size={15} color={Palette.accent} />
          </>
        ) : (
          <ThemedText type="caption" style={{ color: Palette.textSecondary }}>—</ThemedText>
        )}
      </TouchableOpacity>

      <View style={[styles.tableCol, { flex: 1 }]}>
        <TextInput
          style={[styles.tableInput, wFocus && styles.tableInputFocused]}
          value={set.weight}
          placeholder="0"
          placeholderTextColor={Palette.textSecondary}
          keyboardType="numeric"
          onFocus={() => setWFocus(true)}
          onBlur={() => setWFocus(false)}
          onChangeText={(t) => onUpdate("weight", t)}
        />
      </View>
      <View style={[styles.tableCol, { flex: 1 }]}>
        <TextInput
          style={[styles.tableInput, rFocus && styles.tableInputFocused]}
          value={set.reps}
          placeholder="0"
          placeholderTextColor={Palette.textSecondary}
          keyboardType="numeric"
          onFocus={() => setRFocus(true)}
          onBlur={() => setRFocus(false)}
          onChangeText={(t) => onUpdate("reps", t)}
        />
      </View>
      <View style={[styles.tableCol, { flex: 0.6, alignItems: 'center' }]}>
        <TouchableOpacity
          onPress={() => {
            if (!set.done) {
              const w = parseFloat(set.weight);
              const r = parseFloat(set.reps);
              if (!set.weight || !set.reps || isNaN(w) || isNaN(r) || w <= 0 || r <= 0) {
                Alert.alert("Invalid set", "Enter weight and reps greater than 0 before marking as done.");
                return;
              }
            }
            onUpdate("done", !set.done);
          }}
          style={[styles.checkbox, set.done && styles.checkboxDone]}
        >
          {set.done && <Ionicons name="checkmark" size={16} color={Palette.surface} />}
        </TouchableOpacity>
      </View>
      <View style={[styles.tableCol, { flex: 0.4, alignItems: 'center' }]}>
        <TouchableOpacity
          onPress={canRemove ? onRemove : undefined}
          disabled={!canRemove}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ opacity: canRemove ? 1 : 0.2 }}
        >
          <Ionicons name="remove-circle-outline" size={16} color={Palette.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ExerciseCard = ({
  ex, index, isExpanded, expandAnim,
  onToggle, onUpdateSet, onCopyPrev, onAddSet, onRemove, onRemoveSet, onDrag, isDragging,
}: any) => {
  const [noteFocus, setNoteFocus] = useState(false);
  const doneCount = ex.sets.filter((s: SetItem) => s.done).length;
  const allDone = doneCount > 0 && doneCount === ex.sets.length;
  const maxPrev = Math.max(0, ...ex.sets.map((s: SetItem) => s.prevWeight ?? 0));

  return (
    <View style={[styles.exerciseCard, allDone && styles.exerciseCardDone, isDragging && styles.exerciseCardDragging]}>
      {/* Header row: toggle area + drag handle + remove button */}
      <View style={styles.exerciseHeaderRow}>
        <TouchableOpacity onPress={onToggle} style={styles.exerciseHeaderTouch} activeOpacity={0.7}>
          <ThemedText style={styles.exNumber}>{index + 1}</ThemedText>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.xs }}>
            {allDone && <Ionicons name="checkmark-circle" size={16} color={Palette.success} />}
            <ThemedText type="bodyLarge" style={{ color: allDone ? Palette.success : Palette.accent, flexShrink: 1 }} numberOfLines={1}>
              {ex.name}
            </ThemedText>
          </View>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={Palette.textSecondary} />
        </TouchableOpacity>

        {/* Drag handle — long-press 1 s to start dragging */}
        <TouchableOpacity
          onLongPress={onDrag}
          delayLongPress={1000}
          style={styles.dragHandle}
          activeOpacity={0.6}
        >
          <Ionicons name="reorder-three-outline" size={22} color={Palette.textSecondary} />
        </TouchableOpacity>

        {/* Remove exercise button */}
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={styles.removeExBtn}>
          <Ionicons name="close" size={18} color={Palette.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Expanded content */}
      <Animated.View style={{
        overflow: 'hidden',
        maxHeight: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2000] }),
        opacity: expandAnim,
      }}>
        <View style={styles.exerciseContent}>
          <View style={styles.tableRow}>
            <ThemedText type="caption" style={[styles.tableColHeader, { flex: 0.5 }]}>Set</ThemedText>
            <ThemedText type="caption" style={[styles.tableColHeader, { flex: 1.5, textAlign: 'left' }]}>Previous</ThemedText>
            <ThemedText type="caption" style={[styles.tableColHeader, { flex: 1 }]}>kg</ThemedText>
            <ThemedText type="caption" style={[styles.tableColHeader, { flex: 1 }]}>Reps</ThemedText>
            <ThemedText type="caption" style={[styles.tableColHeader, { flex: 0.6, textAlign: 'center' }]}>✓</ThemedText>
            <View style={{ flex: 0.4 }} />
          </View>

          {ex.sets.map((set: any, idx: number) => {
            const w = parseFloat(set.weight) || 0;
            const isPR = maxPrev > 0 && w > maxPrev;
            return (
              <SetRow
                key={set.id}
                set={{ ...set, setNumber: idx + 1 }}
                isPR={isPR}
                canRemove={ex.sets.length > 1}
                onUpdate={(field: string, value: any) => onUpdateSet(ex.key, set.id, field, value)}
                onCopyPrev={() => onCopyPrev(ex.key, set.id)}
                onRemove={() => onRemoveSet(ex.key, set.id)}
              />
            );
          })}

          <View style={[styles.noteContainer, noteFocus && styles.noteContainerFocused]}>
            <Ionicons name="pencil" size={13} color={noteFocus ? Palette.accent : Palette.textSecondary} style={{ marginRight: Spacing.xs }} />
            <TextInput
              style={styles.noteInput}
              placeholder="Note..."
              placeholderTextColor={Palette.textSecondary}
              value={ex.note}
              onFocus={() => setNoteFocus(true)}
              onBlur={() => setNoteFocus(false)}
              onChangeText={(t) => onUpdateSet(ex.key, null, "note", t)}
            />
          </View>

          <TouchableOpacity style={styles.addSetButton} onPress={() => onAddSet(ex.key)} activeOpacity={0.7}>
            <Ionicons name="add" size={15} color={Palette.textSecondary} />
            <ThemedText type="bodySmall" style={{ color: Palette.textSecondary }}>Add set</ThemedText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

export default function CreateSession() {
  const router = useRouter();
  const navigation = useNavigation();
  const { variationId, planName, gymName, exercisesJson } = useLocalSearchParams();
  const draftKey = `workout_draft_${variationId}`;

  const [exercises, setExercises] = useState<ExItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const expandAnims = useRef<Record<string, Animated.Value>>({});

  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const [restVisible, setRestVisible] = useState(false);
  const restBarAnim = useRef(new Animated.Value(0)).current;   // opacity + transform (native driver)
  const restHeightAnim = useRef(new Animated.Value(0)).current; // height collapse (JS driver)
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const { showSessionRunningToast, hideSessionRunningToast } = useSessionToast();
  // Set right before an intentional exit (Discard/Finish) so the listener below
  // doesn't show the "still running" toast for sessions that just ended on purpose.
  const intentionalExitRef = useRef(false);

  // Add Exercise modal
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [allExercises, setAllExercises] = useState<ExerciseEntry[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseMuscle, setExerciseMuscle] = useState<string | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Save draft whenever exercises change (after initial load)
  useEffect(() => {
    if (!loading && exercises.length > 0) {
      AsyncStorage.setItem(draftKey, JSON.stringify({
        exercises,
        startTime: startTimeRef.current,
      })).catch(() => {});
    }
  }, [exercises, loading, draftKey]);

  useEffect(() => {
    const init = async () => {
      // Try to restore an in-progress draft
      try {
        const draftJson = await AsyncStorage.getItem(draftKey);
        if (draftJson) {
          const draft = JSON.parse(draftJson);
          const ageMs = Date.now() - draft.startTime;
          if (ageMs < 24 * 60 * 60 * 1000 && Array.isArray(draft.exercises) && draft.exercises.length > 0) {
            draft.exercises.forEach((ex: ExItem) => {
              expandAnims.current[ex.key] = new Animated.Value(0);
            });
            startTimeRef.current = draft.startTime;
            setExercises(draft.exercises);
            setLoading(false);
            return;
          }
          await AsyncStorage.removeItem(draftKey);
        }
      } catch {}

      // Fresh start
      let base: ExItem[] = [];
      try {
        const parsed = exercisesJson ? JSON.parse(exercisesJson as string) : [];
        base = parsed.map((e: any, i: number) => ({
          key: `e${i}`,
          exerciseId: e.id,
          name: e.name,
          muscleGroup: e.muscleGroup,
          note: "",
          sets: [{ id: "s1", prevWeight: null, prevReps: null, weight: "", reps: "", done: false }],
        }));
      } catch {}

      try {
        if (variationId) {
          const last = await getLastSessionForVariation(variationId as string);
          if (last) {
            base = base.map(ex => {
              const match = last.exercises.find((le: any) => le.exerciseId === ex.exerciseId);
              if (!match || match.sets.length === 0) return ex;
              const sets: SetItem[] = match.sets.map((s: any, i: number) => ({
                id: `s${i + 1}`,
                prevWeight: s.weight,
                prevReps: s.reps,
                weight: "",
                reps: "",
                done: false,
              }));
              return { ...ex, sets };
            });
          }
        }
      } catch {}

      base.forEach(ex => { expandAnims.current[ex.key] = new Animated.Value(0); });
      setExercises(base);
      setLoading(false);
    };
    init();
  }, [draftKey, exercisesJson, variationId]);

  // Count-up timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Rest countdown cleanup
  useEffect(() => {
    return () => { if (restRef.current) clearInterval(restRef.current); };
  }, []);

  // Hide the global "still running" toast immediately if the user navigates
  // straight back into this same active session.
  useEffect(() => {
    hideSessionRunningToast();
  }, [hideSessionRunningToast]);

  // Fires for every way this screen can be left — the custom back button,
  // Android hardware/gesture back, and the iOS swipe-back gesture — so the
  // toast shows no matter how the user navigates away.
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      if (!intentionalExitRef.current) {
        showSessionRunningToast();
      }
    });
    return unsubscribe;
  }, [navigation, showSessionRunningToast]);

  const showRestBar = (alreadyVisible: boolean) => {
    if (!alreadyVisible) {
      setRestVisible(true);
      restBarAnim.setValue(0);
      restHeightAnim.setValue(0);
    }
    Animated.parallel([
      Animated.timing(restBarAnim,    { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.timing(restHeightAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
    ]).start();
  };

  const hideRestBar = () => {
    Animated.parallel([
      Animated.timing(restBarAnim,    { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(restHeightAnim, { toValue: 0, duration: 250, useNativeDriver: false }),
    ]).start(() => setRestVisible(false));
  };

  const startRest = (seconds: number) => {
    if (restRef.current) clearInterval(restRef.current);
    const wasVisible = restVisible;
    setRestRemaining(seconds);
    showRestBar(wasVisible);
    restRef.current = setInterval(() => {
      setRestRemaining(prev => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (restRef.current) clearInterval(restRef.current);
          haptic('success');
          hideRestBar();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRest = () => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRemaining(null);
    hideRestBar();
  };

  const toggleExpand = (key: string) => {
    const isExpanded = !!expandedKeys[key];
    setExpandedKeys(prev => ({ ...prev, [key]: !isExpanded }));
    Animated.timing(expandAnims.current[key], { toValue: isExpanded ? 0 : 1, duration: 250, useNativeDriver: false }).start();
  };

  const updateSet = (exKey: string, setId: string | null, field: string, value: any) => {
    setExercises(prev => prev.map(ex => {
      if (ex.key !== exKey) return ex;
      if (setId === null) return { ...ex, [field]: value };
      return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
    }));
    if (field === "done" && value === true) {
      haptic('success');
      startRest(DEFAULT_REST_SECONDS);
    }
  };

  const copyPrev = (exKey: string, setId: string) => {
    haptic('select');
    setExercises(prev => prev.map(ex => {
      if (ex.key !== exKey) return ex;
      return {
        ...ex,
        sets: ex.sets.map(s => s.id === setId && s.prevWeight != null
          ? { ...s, weight: String(s.prevWeight), reps: String(s.prevReps) }
          : s),
      };
    }));
  };

  const addSet = (exKey: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.key !== exKey) return ex;
      const last = ex.sets[ex.sets.length - 1];
      return {
        ...ex,
        sets: [...ex.sets, {
          id: `s${ex.sets.length + 1}_${Date.now()}`,
          prevWeight: last?.prevWeight ?? null,
          prevReps: last?.prevReps ?? null,
          weight: "",
          reps: "",
          done: false,
        }],
      };
    }));
  };

  const removeSet = useCallback((exKey: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.key !== exKey || ex.sets.length <= 1) return ex;
      return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
    }));
  }, []);

  const removeExercise = useCallback((key: string, name: string) => {
    Alert.alert("Remove Exercise?", `Remove "${name}" from this session?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive", onPress: () => {
          setExercises(prev => prev.filter(ex => ex.key !== key));
          setExpandedKeys(prev => { const next = { ...prev }; delete next[key]; return next; });
          delete expandAnims.current[key];
        },
      },
    ]);
  }, []);

  const discardWorkout = useCallback(() => {
    Alert.alert("Discard Workout?", "This session won't be saved.", [
      { text: "Keep Going", style: "cancel" },
      {
        text: "Discard", style: "destructive", onPress: async () => {
          intentionalExitRef.current = true;
          await AsyncStorage.removeItem(draftKey).catch(() => {});
          router.back();
        },
      },
    ]);
  }, [draftKey, router]);

  const openAddExercise = async () => {
    setShowAddExercise(true);
    if (allExercises.length === 0) {
      setLoadingExercises(true);
      try {
        const data = await fetchAllExercises();
        const arr: ExerciseEntry[] = Array.isArray(data) ? data : (data?.$values ?? []);
        setAllExercises(arr);
      } catch {}
      setLoadingExercises(false);
    }
  };

  const addExerciseFromModal = (exercise: ExerciseEntry) => {
    const key = `e_add_${Date.now()}`;
    const newEx: ExItem = {
      key,
      exerciseId: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      note: '',
      sets: [{ id: 's1', prevWeight: null, prevReps: null, weight: '', reps: '', done: false }],
    };
    expandAnims.current[key] = new Animated.Value(1);
    setExercises(prev => [...prev, newEx]);
    setExpandedKeys(prev => ({ ...prev, [key]: true }));
    setShowAddExercise(false);
    setExerciseSearch('');
    setExerciseMuscle(null);
  };

  const totalSets = useMemo(() => exercises.reduce((sum, ex) => sum + ex.sets.length, 0), [exercises]);
  const doneSets = useMemo(() => exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.done).length, 0), [exercises]);
  const totalVolume = useMemo(() => exercises.reduce((sum, ex) =>
    sum + ex.sets.reduce((ss, s) => ss + (s.done ? (parseFloat(s.weight) || 0) * (parseFloat(s.reps) || 0) : 0), 0), 0), [exercises]);

  const finishWorkout = useCallback(async () => {
    const completed = exercises
      .map(ex => ({ ...ex, doneSets: ex.sets.filter(s => s.done && (parseFloat(s.weight) > 0 || parseFloat(s.reps) > 0)) }))
      .filter(ex => ex.doneSets.length > 0);

    if (completed.length === 0) {
      Alert.alert("Nothing logged", "Check off at least one set before finishing.", [
        { text: "Keep going", style: "cancel" },
        { text: "Discard", style: "destructive", onPress: async () => {
          intentionalExitRef.current = true;
          await AsyncStorage.removeItem(draftKey).catch(() => {});
          router.back();
        }},
      ]);
      return;
    }

    Alert.alert("Finish workout?", `${doneSets} sets · ${formatNumber(totalVolume)} kg · ${formatClock(elapsed)}`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish", onPress: async () => {
          try {
            setSaving(true);
            const sessionId = await createSession(variationId as string);
            for (const ex of completed) {
              const seid = await addExerciseToSession(sessionId, ex.exerciseId, ex.note);
              for (const s of ex.doneSets) {
                await apiAddSet(seid, parseInt(s.reps) || 0, parseFloat(s.weight) || 0);
              }
            }
            await finishSession(sessionId, elapsed);
            await AsyncStorage.removeItem(draftKey).catch(() => {});
            haptic('success');
            intentionalExitRef.current = true;
            router.back();
          } catch {
            Alert.alert("Error", "Could not save your workout. Please try again.");
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  }, [exercises, doneSets, totalVolume, elapsed, variationId, router, draftKey]);

  const filteredAddExercises = useMemo(() =>
    allExercises
      .filter(e => !exercises.some(ex => ex.exerciseId === e.id))
      .filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
      .filter(e => {
        if (!exerciseMuscle) return true;
        const m = (e.muscleGroup || '').toLowerCase();
        const targets = muscleGroupsMapping[exerciseMuscle] || [exerciseMuscle.toLowerCase()];
        return targets.some(t => m.includes(t)) || m === exerciseMuscle.toLowerCase();
      })
      .sort((a, b) => a.name.localeCompare(b.name)),
    [allExercises, exercises, exerciseSearch, exerciseMuscle]
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Palette.accent} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {/* Page header — back button + plan/gym name + discard */}
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={26} color={Palette.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <ThemedText type="headingMedium" numberOfLines={1}>{planName || "Workout"}</ThemedText>
          {!!gymName && (
            <View style={styles.gymTag}>
              <Ionicons name="location" size={11} color={Palette.textSecondary} />
              <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{gymName}</ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={discardWorkout} style={styles.discardBtn} activeOpacity={0.8}>
          <ThemedText style={styles.discardBtnText}>Discard</ThemedText>
          <Ionicons name="close" size={15} color={Palette.textOnAccent} />
        </TouchableOpacity>
      </View>

      {/* Hero card — timer + progress + stats */}
      <View style={styles.hero}>
        <View style={styles.heroStatsRow}>
          <ThemedText style={styles.heroTimer}>{formatClock(elapsed)}</ThemedText>
          <View style={styles.heroStatCol}>
            <View style={styles.heroStatBox}>
              <ThemedText style={styles.heroStatLabel}>sets</ThemedText>
              <ThemedText style={styles.heroStatNum}>{doneSets}/{totalSets}</ThemedText>
            </View>
            <View style={styles.heroStatBox}>
              <ThemedText style={styles.heroStatLabel}>kg volume</ThemedText>
              <ThemedText style={styles.heroVolumeNum}>{formatNumber(totalVolume)}</ThemedText>
            </View>
          </View>
        </View>
      </View>

      {/* Rest timer bar — height + fade animate together so cards slide as bar appears/disappears */}
      {restVisible && (
        <Animated.View style={{
          maxHeight: restHeightAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] }),
          overflow: 'hidden',
          marginHorizontal: Spacing.lg,
          marginTop: Spacing.sm,
        }}>
          <Animated.View style={[styles.restBar, { opacity: restBarAnim }]}>
            <Ionicons name="timer-outline" size={17} color={Palette.textOnAccent} />
            <ThemedText style={styles.restText}>Rest {formatClock(restRemaining ?? 0)}</ThemedText>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => startRest((restRemaining ?? 0) + 15)} style={styles.restActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={styles.restAction}>+15s</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity onPress={stopRest} style={styles.restActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <ThemedText style={styles.restAction}>Skip</ThemedText>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}

      {/* Exercise list — DraggableFlatList handles drag-to-reorder */}
      <DraggableFlatList
        data={exercises}
        keyExtractor={(item) => item.key}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        animationConfig={{ damping: 18, stiffness: 90, mass: 0.9 }}
        onDragEnd={({ data }) => {
          setExercises(data);
          haptic('select');
        }}
        ListEmptyComponent={
          <ThemedText type="bodySmall" style={styles.emptyText}>
            This gym has no exercises. Add some from the plan first.
          </ThemedText>
        }
        ListFooterComponent={
          <>
            <TouchableOpacity style={styles.addExerciseButton} onPress={openAddExercise} activeOpacity={0.7}>
              <Ionicons name="add-circle-outline" size={18} color={Palette.accent} />
              <ThemedText style={styles.addExerciseText}>Add Exercise</ThemedText>
            </TouchableOpacity>
            <View style={{ height: 90 }} />
          </>
        }
        renderItem={({ item, drag, isActive, getIndex }) => (
          <ScaleDecorator activeScale={0.97}>
            <ExerciseCard
              ex={item}
              index={getIndex() ?? 0}
              isExpanded={!!expandedKeys[item.key]}
              expandAnim={expandAnims.current[item.key]}
              onToggle={() => toggleExpand(item.key)}
              onUpdateSet={updateSet}
              onCopyPrev={copyPrev}
              onAddSet={addSet}
              onRemove={() => removeExercise(item.key, item.name)}
              onRemoveSet={removeSet}
              onDrag={drag}
              isDragging={isActive}
            />
          </ScaleDecorator>
        )}
      />

      {/* Finish bar */}
      <View style={styles.footer}>
        <TouchableOpacity style={[styles.finishButton, saving && { opacity: 0.6 }]} onPress={finishWorkout} disabled={saving} activeOpacity={0.85}>
          {saving ? (
            <ActivityIndicator color={Palette.textOnAccent} />
          ) : (
            <>
              <Ionicons name="checkmark-done" size={20} color={Palette.textOnAccent} />
              <ThemedText style={styles.finishButtonText}>Finish Workout</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Add Exercise Modal */}
      <Modal visible={showAddExercise} animationType="slide" transparent onRequestClose={() => { setShowAddExercise(false); setExerciseSearch(''); setExerciseMuscle(null); }}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => { setShowAddExercise(false); setExerciseSearch(''); setExerciseMuscle(null); }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <ThemedText type="headingMedium">Add Exercise</ThemedText>
              <TouchableOpacity onPress={() => { setShowAddExercise(false); setExerciseSearch(''); setExerciseMuscle(null); }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={Palette.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearch}>
              <Ionicons name="search" size={16} color={Palette.textSecondary} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search exercises..."
                placeholderTextColor={Palette.textSecondary}
                value={exerciseSearch}
                onChangeText={setExerciseSearch}
                autoFocus
              />
              {exerciseSearch.length > 0 && (
                <TouchableOpacity onPress={() => setExerciseSearch('')}>
                  <Ionicons name="close-circle" size={16} color={Palette.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalFilterRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <FilterChip label="All" selected={exerciseMuscle === null} onPress={() => setExerciseMuscle(null)} />
                {['Chest', 'Back', 'Shoulder', 'Legs', 'Biceps', 'Triceps', 'Core'].map(muscle => (
                  <FilterChip
                    key={muscle}
                    label={muscle}
                    selected={exerciseMuscle === muscle}
                    onPress={() => setExerciseMuscle(muscle === exerciseMuscle ? null : muscle)}
                  />
                ))}
              </ScrollView>
            </View>

            <View style={{ flex: 1 }}>
              {loadingExercises ? (
                <ActivityIndicator size="small" color={Palette.accent} style={{ marginTop: Spacing.xl }} />
              ) : (
                <FlatList
                  data={filteredAddExercises}
                  keyExtractor={item => String(item.id)}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.modalExItem} onPress={() => addExerciseFromModal(item)} activeOpacity={0.7}>
                      <View>
                        <ThemedText type="bodyLarge">{item.name}</ThemedText>
                        <ThemedText type="caption" style={{ color: Palette.textSecondary }}>{item.muscleGroup}</ThemedText>
                      </View>
                      <Ionicons name="add-circle" size={22} color={Palette.accent} />
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: Palette.border }} />}
                  keyboardShouldPersistTaps="handled"
                />
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.background,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: 52,
    paddingBottom: Spacing.sm,
    backgroundColor: Palette.background,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.card,
  },
  gymTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  hero: {
    backgroundColor: Palette.accent,
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
    ...Shadows.button,
  },
  heroTimer: {
    color: Palette.textOnAccent,
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
  },
  heroStatCol: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.lg,
  },
  heroStatBox: {
    alignItems: 'flex-end',
  },
  heroStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  heroStatNum: {
    color: Palette.textOnAccent,
    fontSize: 20,
    fontWeight: '700',
  },
  heroVolumeNum: {
    color: Palette.textOnAccent,
    fontSize: 20,
    fontWeight: '800',
    fontFamily: Typography.displayLarge.fontFamily,
  },
  heroStatLabel: {
    color: Palette.textOnAccent,
    opacity: 0.75,
    fontSize: 11,
    // marginBottom: Spacing.xs,
  },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.textPrimary,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.cardHover,
  },
  restText: {
    color: Palette.textOnAccent,
    fontWeight: '700',
    fontSize: 14,
    marginLeft: 2,
  },
  restActionBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  restAction: {
    color: PR_GOLD,
    fontWeight: '700',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  exerciseCard: {
    borderRadius: Radius.md,
    marginBottom: 6,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    overflow: 'hidden',
  },
  exerciseCardDone: {
    borderColor: Palette.success,
    borderWidth: 1.5,
  },
  exerciseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exerciseHeaderTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  exNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.textSecondary,
    minWidth: 16,
  },
  setCountPill: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  dragHandle: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeExBtn: {
    padding: Spacing.xs,
    paddingRight: Spacing.sm,
  },
  exerciseCardDragging: {
    borderColor: Palette.accent,
    elevation: 8,
  },
  exerciseContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tableRowDone: {
    opacity: 0.55,
  },
  tableColHeader: {
    color: Palette.textSecondary,
    textAlign: 'center',
    fontSize: 11,
  },
  tableCol: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  setNumberBadge: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.sm,
    width: 30,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableInput: {
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.sm,
    width: '100%',
    height: 30,
    textAlign: 'center',
    color: Palette.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  tableInputFocused: {
    borderWidth: 1.5,
    borderColor: Palette.accent,
    backgroundColor: Palette.surface,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: Radius.sm,
    backgroundColor: Palette.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.border,
  },
  checkboxDone: {
    backgroundColor: Palette.success,
    borderColor: Palette.success,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
    paddingVertical: 3,
    marginTop: 2,
    marginBottom: 4,
  },
  noteContainerFocused: {
    borderBottomColor: Palette.accent,
  },
  noteInput: {
    flex: 1,
    fontSize: 13,
    color: Palette.textPrimary,
    padding: 0,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    gap: Spacing.xs,
    backgroundColor: Palette.surfaceAlt,
    borderRadius: Radius.sm,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xs,
    borderWidth: 1.5,
    borderColor: Palette.accent,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
  },
  addExerciseText: {
    color: Palette.accent,
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 36,
    backgroundColor: Palette.background,
    borderTopWidth: 1,
    borderTopColor: Palette.border,
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Palette.success,
    paddingVertical: Spacing.md + 2,
    borderRadius: Radius.lg,
    ...Shadows.button,
  },
  finishButtonText: {
    color: Palette.textOnAccent,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Typography.bodyLarge.fontFamily,
  },
  emptyText: {
    textAlign: 'center',
    color: Palette.textSecondary,
    marginTop: Spacing.xl,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Palette.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    height: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Palette.border,
  },
  modalSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Palette.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: Palette.textPrimary,
    padding: 0,
  },
  modalFilterRow: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  modalExItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  discardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Palette.danger,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  discardBtnText: {
    color: Palette.textOnAccent,
    fontSize: 13,
    fontWeight: '700',
  },
});

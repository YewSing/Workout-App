import { authFetch } from './http';

const jsonHeaders = { "Content-Type": "application/json" };

// Start a new session for a gym (variation). Returns the new sessionId.
export async function createSession(variationId: number | string) {
  const res = await authFetch(`/Session`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({
      workoutVariationId: Number(variationId),
      dateTime: new Date().toISOString(),
    }),
  });
  if (!res.ok) throw new Error("Failed to start session");
  return res.json(); // sessionId (int)
}

// Add an exercise to a session. Returns the new sessionExerciseId.
export async function addExerciseToSession(sessionId: number, exerciseId: number, note: string = "") {
  const res = await authFetch(`/Session/${sessionId}/exercise`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ exerciseId, note: note ?? "" }),
  });
  if (!res.ok) throw new Error("Failed to add exercise to session");
  return res.json(); // sessionExerciseId (int)
}

// Add a single set under a session-exercise. breakTime is a TimeSpan string "hh:mm:ss".
export async function addSet(sessionExerciseId: number, reps: number, weight: number, breakTime: string = "00:00:00") {
  const res = await authFetch(`/Session/exercise/${sessionExerciseId}/set`, {
    method: "POST",
    headers: jsonHeaders,
    body: JSON.stringify({ reps, weight, breakTime }),
  });
  if (!res.ok) throw new Error("Failed to add set");
  return true;
}

// Temporary diagnostic payload for tracking down a bug where Duration is saved as 0
// despite a real elapsed time on the client. Logged server-side; safe to remove once
// that's root-caused.
export interface FinishSessionDebug {
  startTime?: number;
  clientNow?: number;
  restoreSource?: string;
  restoreDetail?: string;
}

// Persist the elapsed duration when the workout is finished. durationSeconds -> "hh:mm:ss".
export async function finishSession(sessionId: number, durationSeconds: number, debug?: FinishSessionDebug) {
  const h = Math.floor(durationSeconds / 3600);
  const m = Math.floor((durationSeconds % 3600) / 60);
  const s = Math.floor(durationSeconds % 60);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const duration = `${pad(h)}:${pad(m)}:${pad(s)}`;

  const res = await authFetch(`/Session/${sessionId}`, {
    method: "PUT",
    headers: jsonHeaders,
    body: JSON.stringify({ duration, debug }),
  });
  if (!res.ok) throw new Error("Failed to finish session");
  return true;
}

export interface LastSet { reps: number; weight: number; }
export interface LastExercise { exerciseId: number; sets: LastSet[]; }
export interface LastSession { sessionId: number; dateTime: string; exercises: LastExercise[]; }

export interface SetDetail { reps: number; weight: number; breakTime: string; }
export interface ExerciseInSession { exerciseId: number; name: string; note: string; sets: SetDetail[]; }
export interface SessionDetails {
  sessionId: number;
  dateTime: string;
  duration: string;
  totalVolume: number;
  exercises: ExerciseInSession[];
}

// Full session data including exercises and sets, used for the session detail view.
export async function getSessionDetails(sessionId: number | string): Promise<SessionDetails> {
  const res = await authFetch(`/Session/${sessionId}`, { method: "GET" });
  if (!res.ok) throw new Error("Failed to load session details");
  const data = await res.json();
  const unwrap = (v: any) => (v && v.$values ? v.$values : v) ?? [];
  return {
    sessionId: data.sessionId,
    dateTime: data.dateTime,
    duration: data.duration,
    totalVolume: data.totalVolume,
    exercises: unwrap(data.exercises).map((e: any) => ({
      exerciseId: e.exerciseId,
      name: e.name,
      note: e.note,
      sets: unwrap(e.sets).map((s: any) => ({ reps: s.reps, weight: s.weight, breakTime: s.breakTime })),
    })),
  };
}

// Most recent session for a gym, used to prefill "previous" weight/reps.
// Returns null when there is no history yet (backend replies 204).
export async function getLastSessionForVariation(variationId: number | string): Promise<LastSession | null> {
  const res = await authFetch(`/Session/variation/${variationId}/last`, { method: "GET" });
  if (res.status === 204) return null;
  if (!res.ok) throw new Error("Failed to load previous session");
  const data = await res.json();
  // Unwrap EF reference-handler shapes if present.
  const unwrap = (v: any) => (v && v.$values ? v.$values : v) ?? [];
  return {
    sessionId: data.sessionId,
    dateTime: data.dateTime,
    exercises: unwrap(data.exercises).map((e: any) => ({
      exerciseId: e.exerciseId,
      sets: unwrap(e.sets).map((s: any) => ({ reps: s.reps, weight: s.weight })),
    })),
  };
}

import { authFetch } from './http';

export async function createWorkoutTemplate(name: string, description: string, variationName: string, exerciseIds: number[]) {
  const res = await authFetch(`/Workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, variationName, exerciseIds }),
  });

  if (!res.ok) throw new Error("Failed to save workout template");
  return res.json();
}

// ── Variations ("Gyms") ──

export async function createVariation(workoutId: number | string, name: string, exerciseIds: number[]) {
  const res = await authFetch(`/Workouts/${workoutId}/variations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, exerciseIds }),
  });
  if (!res.ok) throw new Error("Failed to add gym");
  return res.json();
}

export async function updateVariation(variationId: number | string, name: string, exerciseIds: number[]) {
  const res = await authFetch(`/Workouts/variations/${variationId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, exerciseIds }),
  });
  if (!res.ok) throw new Error("Failed to update gym");
  return true;
}

export async function deleteVariation(variationId: number | string) {
  const res = await authFetch(`/Workouts/variations/${variationId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    // Backend returns 400 when trying to remove the only remaining gym.
    let message = "Failed to delete gym";
    try { const body = await res.json(); if (body?.message) message = body.message; } catch {}
    throw new Error(message);
  }
  return true;
}

export async function fetchAllExercises() {
  const res = await authFetch(`/Exercises`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch exercises");
  return res.json();
}

export async function createExercise(name: string, muscleGroup: string, description?: string, photoUrl?: string) {
  const res = await authFetch(`/Exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, muscleGroup, description, photoUrl }),
  });
  if (!res.ok) throw new Error("Failed to create exercise");
  return res.json();
}

export async function fetchExerciseHistory(exerciseId: number | string) {
  const res = await authFetch(`/Exercises/${exerciseId}/history`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to fetch exercise history");
  return res.json();
}

export async function fetchWorkouts() {
  const res = await authFetch(`/Workouts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch workouts");
  return res.json();
}

export async function fetchWorkoutById(id: number | string) {
  const res = await authFetch(`/Workouts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch workout details");
  return res.json();
}

export async function updateWorkoutTemplate(id: number | string, name: string, description: string, exerciseIds: number[]) {
  const res = await authFetch(`/Workouts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name, description, exerciseIds }),
  });

  if (!res.ok) throw new Error("Failed to update workout template");
  // Usually PUT returns empty content (204 No Content), so we don't return res.json()
  return true;
}

export async function deleteWorkoutTemplate(id: number | string) {
  const res = await authFetch(`/Workouts/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Failed to delete workout template");
  return true;
}

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { BASE_URL } from './config';

async function getToken() {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
  }
  return await SecureStore.getItemAsync('userToken');
}

export async function createWorkoutTemplate(name: string, description: string, exerciseIds: number[]) {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}/Workouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}` // Required for [Authorize] attribute
    },
    body: JSON.stringify({ name, description, exerciseIds }),
  });

  if (!res.ok) throw new Error("Failed to save workout template");
  return res.json();
}

export async function fetchAllExercises() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/Exercises`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }); 
  if (!res.ok) throw new Error("Failed to fetch exercises");
  return res.json();
}

export async function fetchWorkouts() {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/Workouts`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }); 
  if (!res.ok) throw new Error("Failed to fetch workouts");
  return res.json();
}

export async function fetchWorkoutById(id: number | string) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/Workouts/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  }); 
  if (!res.ok) throw new Error("Failed to fetch workout details");
  return res.json();
}

export async function updateWorkoutTemplate(id: number | string, name: string, description: string, exerciseIds: number[]) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/Workouts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, description, exerciseIds }),
  });

  if (!res.ok) throw new Error("Failed to update workout template");
  // Usually PUT returns empty content (204 No Content), so we don't return res.json()
  return true;
}

export async function deleteWorkoutTemplate(id: number | string) {
  const token = await getToken();
  const res = await fetch(`${BASE_URL}/Workouts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) throw new Error("Failed to delete workout template");
  return true;
}
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
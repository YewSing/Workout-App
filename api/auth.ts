import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { BASE_URL } from './config';

const AUTH_URL = `${BASE_URL}/auth`;

async function saveToken(token: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.setItem('userToken', token);
  } else {
    await SecureStore.setItemAsync('userToken', token);
  }
}

export async function register(email: string, password: string, username: string) {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      username,
    }),
  });

  const data = await res.json(); 

  if (data && data.token) {
    await saveToken(data.token);
  }

  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (!res.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await res.json(); 

  if (data && data.token) {
    await saveToken(data.token);
  }

  return data;
}
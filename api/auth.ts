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
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? "Invalid credentials");
  }

  const data = await res.json(); 

  if (data && data.token) {
    await saveToken(data.token);
  }

  return data;
}

export async function getMe(): Promise<{ email: string; username: string } | null> {
  const token = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? localStorage.getItem('userToken') : null)
    : await SecureStore.getItemAsync('userToken');
  if (!token) return null;
  const res = await fetch(`${AUTH_URL}/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  const res = await fetch(`${AUTH_URL}/logout`, {
    method: "POST",
  });

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') localStorage.removeItem('userToken');
  } else {
    await SecureStore.deleteItemAsync('userToken');
  }

  return res;
}
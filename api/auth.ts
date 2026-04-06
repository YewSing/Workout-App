import * as SecureStore from 'expo-secure-store';

const BASE_URL = "http://192.168.100.156:5197/api/auth";

export async function register(email: string, password: string, username: string) {
  const res = await fetch(`${BASE_URL}/register`, {
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

// 1. You must await the json parsing to get the data object
  const data = await res.json(); 

  // 2. Based on your .NET AuthResponseDto, the token is in data.token
  if (data && data.token) {
    await SecureStore.setItemAsync('userToken', data.token);
  }

  return data;
}

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/login`, {
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

  return res.json(); // { token }
}
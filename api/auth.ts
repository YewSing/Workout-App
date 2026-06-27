import { BASE_URL } from './config';
import { authFetch } from './http';
import { saveTokens, clearTokens } from './tokenStorage';

const AUTH_URL = `${BASE_URL}/auth`;

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

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const errors = body?.errors as Record<string, string[]> | undefined;
    const fieldError = errors ? Object.values(errors)[0]?.[0] : undefined;
    throw new Error(body?.message ?? fieldError ?? body?.title ?? "Registration failed");
  }

  const data = await res.json();

  if (data?.token && data?.refreshToken) {
    await saveTokens(data.token, data.refreshToken);
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

  if (data?.token && data?.refreshToken) {
    await saveTokens(data.token, data.refreshToken);
  }

  return data;
}

export async function getMe(): Promise<{ email: string; username: string } | null> {
  const res = await authFetch('/auth/me', { method: 'GET' });
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  const res = await authFetch('/auth/logout', { method: 'POST' });
  await clearTokens();
  return res;
}

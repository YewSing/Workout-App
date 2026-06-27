import { BASE_URL } from './config';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from './tokenStorage';

const AUTH_URL = `${BASE_URL}/auth`;

// Shared across all callers: while a refresh is in progress, concurrent 401s
// await this same promise instead of each firing their own /auth/refresh call.
// That matters because refresh rotates the token -- a second, parallel refresh
// call would present an already-rotated-out token and fail.
let refreshPromise: Promise<boolean> | null = null;

async function performRefresh(): Promise<boolean> {
  const storedRefreshToken = await getRefreshToken();
  if (!storedRefreshToken) return false;

  try {
    const res = await fetch(`${AUTH_URL}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (!data?.token || !data?.refreshToken) return false;

    await saveTokens(data.token, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function withAuthHeader(init: RequestInit, token: string | null): RequestInit {
  return {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${token}`,
    },
  };
}

// Drop-in replacement for fetch() against BASE_URL-relative paths. Attaches the
// current access token automatically, and on a 401 attempts exactly one silent
// refresh-and-retry before giving up.
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, withAuthHeader(init, token));

  if (res.status !== 401) return res;

  const refreshed = await refreshOnce();
  if (!refreshed) {
    await clearTokens();
    return res;
  }

  const newToken = await getAccessToken();
  return fetch(`${BASE_URL}${path}`, withAuthHeader(init, newToken));
}

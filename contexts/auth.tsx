import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getMe } from '@/api/auth';

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isReady: false, isAuthenticated: false });

// Resolves once at launch whether the tokens already sitting in SecureStore
// (from a previous session) still represent a valid login -- getMe() goes
// through authFetch, so an expired access token is silently refreshed here
// using the long-lived refresh token before we decide where to route.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    getMe()
      .then(data => setIsAuthenticated(!!data))
      .finally(() => setIsReady(true));
  }, []);

  return (
    <AuthContext.Provider value={{ isReady, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

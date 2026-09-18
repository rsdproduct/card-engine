"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AUTH_STORAGE_KEY = "card_engine_auth_status";
export const PROTOTYPE_PASSKEY = "Livecareer@2026";

type AuthContextValue = AuthState & {
  login: (passkey: string) => boolean;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) === "authenticated";
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(readStoredAuth());
    setIsLoading(false);
  }, []);

  const login = useCallback((passkey: string) => {
    if (passkey !== PROTOTYPE_PASSKEY) return false;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, "authenticated");
    } catch {
      // private mode / quota — still unlock this session
    }
    setIsAuthenticated(true);
    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, isLoading, login, logout }),
    [isAuthenticated, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

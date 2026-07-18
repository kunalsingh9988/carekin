import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { UserRole } from "@carekin/shared-types";
import { apiRequest } from "../api/client";

export interface SessionUser {
  id: string;
  phone: string;
  role: UserRole;
}

interface AuthContextValue {
  token: string | null;
  user: SessionUser | null;
  bootstrapping: boolean;
  onboardingComplete: boolean;
  requestOtp: (phone: string, role: UserRole) => Promise<void>;
  verifyOtp: (phone: string, otp: string, role: UserRole) => Promise<void>;
  markOnboardingComplete: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "carekin.session";
const ONBOARDING_KEY_PREFIX = "carekin.onboardingComplete.";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const session = JSON.parse(raw) as { token: string; user: SessionUser };
        setToken(session.token);
        setUser(session.user);
        const done = await AsyncStorage.getItem(ONBOARDING_KEY_PREFIX + session.user.id);
        setOnboardingComplete(done === "true");
      }
      setBootstrapping(false);
    })();
  }, []);

  async function requestOtp(phone: string, role: UserRole) {
    await apiRequest("/auth/otp/request", { method: "POST", body: { phone, role } });
  }

  async function verifyOtp(phone: string, otp: string, role: UserRole) {
    const result = await apiRequest<{ token: string; user: SessionUser }>("/auth/otp/verify", {
      method: "POST",
      body: { phone, otp, role },
    });
    setToken(result.token);
    setUser(result.user);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(result));
    const done = await AsyncStorage.getItem(ONBOARDING_KEY_PREFIX + result.user.id);
    setOnboardingComplete(done === "true");
  }

  async function markOnboardingComplete() {
    if (!user) return;
    await AsyncStorage.setItem(ONBOARDING_KEY_PREFIX + user.id, "true");
    setOnboardingComplete(true);
  }

  async function logout() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
    setOnboardingComplete(false);
  }

  const value = useMemo(
    () => ({ token, user, bootstrapping, onboardingComplete, requestOtp, verifyOtp, markOnboardingComplete, logout }),
    [token, user, bootstrapping, onboardingComplete],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

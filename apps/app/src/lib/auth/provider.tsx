"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useSession } from "@/lib/auth/auth-client";
import type { User, Session } from "./types";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: sessionData, isPending } = useSession();

  const user = sessionData?.session
    ? {
        id: sessionData.session.userId,
        email: sessionData.user.email,
        createdAt: sessionData.user.createdAt.toISOString(),
      }
    : null;

  const session = sessionData?.session
    ? {
        user: user!,
        expiresAt: new Date(sessionData.session.expiresAt),
      }
    : null;

  const value: AuthContextValue = {
    user,
    session,
    isLoading: isPending,
    isAuthenticated: !!sessionData?.session,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

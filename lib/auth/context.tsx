"use client";

import { createContext, useCallback, useContext } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
} from "@/lib/auth/api";
import type { LoginCredentials, User } from "@/lib/auth/types";
import { ApiError } from "@/lib/api/errors";

const CURRENT_USER_QUERY_KEY = ["auth", "current-user"] as const;

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_QUERY_KEY,
    queryFn: getCurrentUser,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (data) => {
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: () => {
      // Clear regardless of whether the API call itself succeeded, so a
      // failed logout request can never leave stale "authenticated" state
      // on screen.
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY_KEY });
      queryClient.clear();
      router.push("/login");
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const data = await loginMutation.mutateAsync(credentials);
      return data.user;
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  // A 401 from the current-user endpoint means "not logged in", not a bug —
  // don't treat it as an error state in the UI.
  const isUnauthenticatedResponse =
    currentUserQuery.error instanceof ApiError &&
    currentUserQuery.error.kind === "authentication";

  const value: AuthContextValue = {
    user: isUnauthenticatedResponse ? null : currentUserQuery.data ?? null,
    isAuthenticated: Boolean(currentUserQuery.data),
    isLoading: currentUserQuery.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

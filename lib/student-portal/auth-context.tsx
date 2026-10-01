"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as api from "@/lib/student-portal/api";
import { getStudentToken, setStudentToken } from "@/lib/student-portal/token";
import type { CurrentUser, LoginCredentials } from "@/lib/student-portal/types";

const CURRENT_USER_KEY = ["student-portal", "current-user"] as const;

interface StudentAuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (credentials: LoginCredentials) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const StudentAuthContext = createContext<StudentAuthContextValue | undefined>(undefined);

/**
 * A separate auth context from lib/auth/context.tsx (the admin/staff one),
 * because it is a separate backend session entirely: Bearer token against
 * the real API, not the cookie-based mock every admin module still targets.
 * Shares the app's single TanStack QueryClient (from the root layout) —
 * only the query keys are namespaced ("student-portal", ...) — but never
 * calls queryClient.clear(), since that instance is shared app-wide.
 */
export function StudentAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => getStudentToken() !== null);

  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: api.getCurrentUser,
    enabled: hasToken,
    retry: false,
  });

  // A token that no longer works (expired, revoked) should drop back to the
  // logged-out state rather than leaving the UI stuck on an error. Adjusted
  // during render (React's documented pattern) rather than in an effect,
  // guarded so it only fires once per failure.
  if (currentUserQuery.isError && hasToken) {
    setStudentToken(null);
    setHasToken(false);
  }

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (result) => {
      setStudentToken(result.token);
      setHasToken(true);
      queryClient.setQueryData(CURRENT_USER_KEY, result.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      // Clear regardless of whether the API call itself succeeded, so a
      // failed logout request can never leave stale "authenticated" state
      // on screen.
      setStudentToken(null);
      setHasToken(false);
      queryClient.removeQueries({ queryKey: ["student-portal"] });
      router.push("/student/login");
    },
  });

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginMutation.mutateAsync(credentials);
      return result.user;
    },
    [loginMutation]
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const value: StudentAuthContextValue = {
    user: currentUserQuery.data ?? null,
    isAuthenticated: hasToken && Boolean(currentUserQuery.data),
    isLoading: hasToken && currentUserQuery.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login,
    logout,
  };

  return <StudentAuthContext.Provider value={value}>{children}</StudentAuthContext.Provider>;
}

export function useStudentAuth(): StudentAuthContextValue {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within a StudentAuthProvider");
  }
  return context;
}

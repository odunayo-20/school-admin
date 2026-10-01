"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import * as api from "@/lib/staff-portal/api";
import { getStaffToken, setStaffToken } from "@/lib/staff-portal/token";
import type { CurrentUser, LoginCredentials } from "@/lib/staff-portal/types";

const CURRENT_USER_KEY = ["staff-portal", "current-user"] as const;

interface StaffAuthContextValue {
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  isLoggingOut: boolean;
  login: (credentials: LoginCredentials) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

const StaffAuthContext = createContext<StaffAuthContextValue | undefined>(undefined);

/**
 * A separate auth context from both lib/auth/context.tsx (admin/mock) and
 * lib/student-portal/auth-context.tsx (student/real backend) — same real
 * backend as the student portal, but its own Bearer token and its own
 * query-key namespace, since a staff session and a student session are
 * never the same login. Shares the app's single TanStack QueryClient.
 */
export function StaffAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => getStaffToken() !== null);

  const currentUserQuery = useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: api.getCurrentUser,
    enabled: hasToken,
    retry: false,
  });

  // A token that no longer works (expired, revoked) should drop back to the
  // logged-out state rather than leaving the UI stuck on an error. Adjusted
  // during render (React's documented pattern), guarded so it only fires
  // once per failure.
  if (currentUserQuery.isError && hasToken) {
    setStaffToken(null);
    setHasToken(false);
  }

  const loginMutation = useMutation({
    mutationFn: api.login,
    onSuccess: (result) => {
      setStaffToken(result.token);
      setHasToken(true);
      queryClient.setQueryData(CURRENT_USER_KEY, result.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: api.logout,
    onSettled: () => {
      setStaffToken(null);
      setHasToken(false);
      queryClient.removeQueries({ queryKey: ["staff-portal"] });
      router.push("/staff-portal/login");
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

  const value: StaffAuthContextValue = {
    user: currentUserQuery.data ?? null,
    isAuthenticated: hasToken && Boolean(currentUserQuery.data),
    isLoading: hasToken && currentUserQuery.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    login,
    logout,
  };

  return <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>;
}

export function useStaffAuth(): StaffAuthContextValue {
  const context = useContext(StaffAuthContext);
  if (!context) {
    throw new Error("useStaffAuth must be used within a StaffAuthProvider");
  }
  return context;
}

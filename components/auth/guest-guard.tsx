"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { getRedirectPathForRole } from "@/lib/auth/roles";

/**
 * Inverse of AuthGuard: keeps an already-authenticated user from landing back
 * on the login page.
 */
export function GuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      router.replace(getRedirectPathForRole(user.role));
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

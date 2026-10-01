"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

/**
 * UX convenience only, mirroring components/student-portal/auth-guard.tsx —
 * the real backend rejects an unauthenticated/expired-token request
 * regardless of what this component does.
 *
 * POST /auth/login has no role restriction — it is the same endpoint for
 * every role (see UserResource/StaffTypeTest) — so a valid STUDENT or
 * ADMIN account can authenticate through this portal's own login form.
 * Every staff-specific endpoint still correctly answers empty/403 for such
 * an account (role is the real boundary, enforced by Laravel), but letting
 * them sit on a dashboard that assumes a staff identity would mislabel
 * them. This check keeps the mismatch from reaching the screen.
 */
export function StaffAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout, isLoggingOut } = useStaffAuth();
  const router = useRouter();
  const isWrongRole = isAuthenticated && user?.role !== "STAFF";

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/staff-portal/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isWrongRole) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="max-w-sm text-sm text-muted-foreground">
          This portal is for staff accounts only. Your account doesn&apos;t have staff access.
        </p>
        <Button variant="outline" size="sm" onClick={() => logout()} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}

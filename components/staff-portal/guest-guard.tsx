"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

/** Inverse of StaffAuthGuard — keeps an already-authenticated staff member
 * off the login page, mirroring components/student-portal/guest-guard.tsx. */
export function StaffGuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useStaffAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/staff-portal/dashboard");
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

  if (isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

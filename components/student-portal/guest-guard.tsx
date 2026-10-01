"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useStudentAuth } from "@/lib/student-portal/auth-context";

/** Inverse of StudentAuthGuard — keeps an already-authenticated student off
 * the login page, mirroring components/auth/guest-guard.tsx. */
export function StudentGuestGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useStudentAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/student/dashboard");
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

"use client";

import { StudentAuthGuard } from "@/components/student-portal/auth-guard";
import { StudentPortalNav } from "@/components/student-portal/nav";
import { Button } from "@/components/ui/button";
import { useStudentAuth } from "@/lib/student-portal/auth-context";

function StudentPortalHeader() {
  const { user, logout, isLoggingOut } = useStudentAuth();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <span className="text-sm font-semibold">Student Portal</span>
      <div className="flex items-center gap-3">
        {user && <span className="text-sm text-muted-foreground">{user.student?.full_name ?? user.name}</span>}
        <Button variant="outline" size="sm" onClick={() => logout()} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </header>
  );
}

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <StudentAuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <StudentPortalHeader />
        <div className="flex flex-1 flex-col md:flex-row">
          <StudentPortalNav />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </StudentAuthGuard>
  );
}

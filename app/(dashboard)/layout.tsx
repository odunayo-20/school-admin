"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

function DashboardHeader() {
  const { user, logout, isLoggingOut } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <span className="text-sm font-semibold">School Admin</span>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-sm text-muted-foreground">{user.name}</span>
        )}
        <Button variant="outline" size="sm" onClick={() => logout()} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <DashboardHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </div>
    </AuthGuard>
  );
}

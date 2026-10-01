"use client";

import { StaffAuthGuard } from "@/components/staff-portal/auth-guard";
import { StaffPortalNav } from "@/components/staff-portal/nav";
import { Button } from "@/components/ui/button";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

function StaffPortalHeader() {
  const { user, logout, isLoggingOut } = useStaffAuth();

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <span className="text-sm font-semibold">Staff Portal</span>
      <div className="flex items-center gap-3">
        {user && <span className="text-sm text-muted-foreground">{user.name}</span>}
        <Button variant="outline" size="sm" onClick={() => logout()} disabled={isLoggingOut}>
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </header>
  );
}

export default function StaffPortalChromeLayout({ children }: { children: React.ReactNode }) {
  return (
    <StaffAuthGuard>
      <div className="flex min-h-full flex-1 flex-col">
        <StaffPortalHeader />
        <div className="flex flex-1 flex-col md:flex-row">
          <StaffPortalNav />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </StaffAuthGuard>
  );
}

"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNav } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";

import { GraduationCap, LogOut } from "lucide-react";
import { useAcademicContext } from "@/lib/academics/queries";

function DashboardHeader() {
  const { user, logout, isLoggingOut } = useAuth();
  const contextQuery = useAcademicContext();
  const context = contextQuery.data;

  const schoolName = context?.school?.name || "School Portal";
  const sessionName = context?.session?.name;
  const termName = context?.term?.name;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/80 bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <span className="text-sm font-semibold tracking-tight text-foreground">{schoolName}</span>
          <p className="text-[11px] font-medium text-muted-foreground">Admin Workspace</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {sessionName && termName ? (
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{sessionName}</span>
            <span className="text-emerald-500/40">•</span>
            <span>{termName}</span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Setup Incomplete</span>
          </div>
        )}

        <div className="flex items-center gap-3 border-l border-border/60 pl-4">
          {user && (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 font-semibold text-xs text-primary">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden flex-col text-left md:flex">
                <span className="text-xs font-medium leading-none text-foreground">{user.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  {user.role.replace("_", " ")}
                </span>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-foreground h-8 px-2.5"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">{isLoggingOut ? "Exiting…" : "Sign out"}</span>
          </Button>
        </div>
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
        <div className="flex flex-1 flex-col md:flex-row">
          <AppNav />
          <div className="flex flex-1 flex-col">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

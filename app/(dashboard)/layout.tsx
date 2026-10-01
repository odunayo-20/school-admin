"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, GraduationCap, LogOut, ChevronRight, School as SchoolIcon } from "lucide-react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AppNav } from "@/components/layout/nav";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useAcademicContext } from "@/lib/academics/queries";
import { CommandPalette } from "@/components/layout/command-palette";

function getBreadcrumb(pathname: string): { section: string; title: string } {
  if (pathname === "/dashboard") return { section: "Overview", title: "Dashboard" };
  if (pathname.startsWith("/students")) return { section: "Learners", title: "Students Directory" };
  if (pathname.startsWith("/admissions")) return { section: "Learners", title: "Admissions Intake" };
  if (pathname.startsWith("/promotions")) return { section: "Learners", title: "Promotions Engine" };
  if (pathname.startsWith("/academics/sessions")) return { section: "Academic Structure", title: "Sessions & Terms" };
  if (pathname.startsWith("/academics/classes")) return { section: "Academic Structure", title: "Classes & Arms" };
  if (pathname.startsWith("/academics/subjects")) return { section: "Academic Structure", title: "Curriculum Subjects" };
  if (pathname.startsWith("/settings/grading")) return { section: "Academic Structure", title: "Grading Scales" };
  if (pathname.startsWith("/academics")) return { section: "Overview", title: "Academic Overview" };
  if (pathname.startsWith("/staff")) return { section: "Personnel", title: "Faculty & Staff" };
  if (pathname.startsWith("/results")) return { section: "Examinations", title: "Results & Grading" };
  if (pathname.startsWith("/school")) return { section: "Administration", title: "School Profile" };
  return { section: "Portal", title: "Workspace" };
}

function DashboardHeader({ onOpenMobileMenu }: { onOpenMobileMenu: () => void }) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const contextQuery = useAcademicContext();
  const context = contextQuery.data;

  const sessionName = context?.session?.name;
  const termName = context?.term?.name;
  const breadcrumb = getBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border/80 bg-background/80 px-4 md:px-8 backdrop-blur-md">
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Menu Toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
          aria-label="Open sidebar menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <span className="hidden font-medium text-muted-foreground/80 sm:inline">
            {breadcrumb.section}
          </span>
          <ChevronRight className="hidden h-3.5 w-3.5 text-muted-foreground/40 sm:inline" />
          <span className="font-semibold text-foreground">{breadcrumb.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search / Command Palette */}
        <CommandPalette />

        {/* Live Academic Context Pill */}
        {sessionName && termName ? (
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{sessionName}</span>
            <span className="text-emerald-500/40">•</span>
            <span>{termName}</span>
          </div>
        ) : (
          <div className="hidden items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 sm:flex">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Calendar Pending</span>
          </div>
        )}

        {/* User quick status in header */}
        <div className="flex items-center gap-3 border-l border-border/60 pl-3 md:pl-4">
          {user && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-semibold text-xs text-primary-foreground shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden text-xs font-medium text-foreground lg:inline">
                {user.name}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Full-height Modern SaaS Sidebar */}
        <AppNav mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          <DashboardHeader onOpenMobileMenu={() => setMobileOpen(true)} />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </AuthGuard>
  );
}

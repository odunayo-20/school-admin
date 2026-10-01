"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ChevronRight,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  PanelLeftClose,
  Percent,
  School as SchoolIcon,
  Settings,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import {
  canAccessResults,
  canManageAdmissions,
  canManagePromotions,
  canManageSchoolConfig,
  canManageStaff,
  canManageStudents,
} from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import { useAcademicContext } from "@/lib/academics/queries";
import { useAdmissionList } from "@/lib/admissions/queries";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: (pendingCount: number) => React.ReactNode;
  visible: (role: UserRole) => boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, visible: () => true },
      { href: "/academics", label: "Academic Overview", icon: Calendar, visible: canManageStaff },
    ],
  },
  {
    title: "Learners & Enrollment",
    items: [
      { href: "/students", label: "Students", icon: GraduationCap, visible: canManageStudents },
      {
        href: "/admissions",
        label: "Admissions",
        icon: ClipboardList,
        visible: canManageAdmissions,
        badge: (pendingCount: number) =>
          pendingCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </span>
          ) : null,
      },
      { href: "/promotions", label: "Promotions", icon: TrendingUp, visible: canManagePromotions },
    ],
  },
  {
    title: "Academic Structure",
    items: [
      { href: "/academics/sessions", label: "Sessions & Terms", icon: Calendar, visible: canManageSchoolConfig },
      { href: "/academics/classes", label: "Classes & Arms", icon: Layers, visible: canManageSchoolConfig },
      { href: "/academics/subjects", label: "Subjects", icon: BookOpen, visible: canManageSchoolConfig },
      { href: "/settings/grading", label: "Grading Scales", icon: Percent, visible: canManageSchoolConfig },
    ],
  },
  {
    title: "Faculty & Staff",
    items: [
      { href: "/staff", label: "Staff Directory", icon: Users, visible: canManageStaff },
    ],
  },
  {
    title: "Examinations",
    items: [
      { href: "/results", label: "Results & Grading", icon: FileCheck2, visible: canAccessResults },
    ],
  },
  {
    title: "Administration",
    items: [
      { href: "/school", label: "School Profile", icon: SchoolIcon, visible: canManageSchoolConfig },
    ],
  },
];

interface AppNavProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AppNav({ mobileOpen, onMobileClose }: AppNavProps) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();
  const contextQuery = useAcademicContext();
  const admissionsQuery = useAdmissionList({ page: 1 });

  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("admin_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const schoolName = contextQuery.data?.school?.name || "School Portal";
  const pendingAdmissions = useMemo(() => {
    return (admissionsQuery.data?.data ?? []).filter((a) => a.status === "pending").length;
  }, [admissionsQuery.data?.data]);

  if (!user) return null;

  // Sidebar content component shared between desktop and mobile drawer
  const NavContent = ({ isDrawer = false }: { isDrawer?: boolean }) => {
    const collapsed = isDrawer ? false : isCollapsed;

    return (
      <div className="flex h-full flex-col justify-between">
        {/* Top: Brand & Header */}
        <div>
          <div className="flex h-16 items-center justify-between border-b border-border/80 px-4">
            <Link
              href="/dashboard"
              className={cn(
                "group flex items-center gap-3 overflow-hidden transition-all",
                collapsed ? "justify-center" : ""
              )}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
                <GraduationCap className="h-5 w-5" aria-hidden="true" />
              </div>
              {!collapsed && (
                <div className="flex flex-col overflow-hidden text-left">
                  <span
                    className="truncate text-sm font-bold tracking-tight text-foreground"
                    title={schoolName}
                  >
                    {schoolName}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    Admin Workspace
                  </span>
                </div>
              )}
            </Link>

            {/* Desktop Collapse Button */}
            {!isDrawer && (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-expanded={!isCollapsed}
                className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:flex"
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <PanelLeft className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Mobile Close Button */}
            {isDrawer && (
              <button
                type="button"
                onClick={onMobileClose}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Nav List */}
          <nav className="space-y-6 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter((item) => item.visible(user.role));
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-1">
                  {!collapsed ? (
                    <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                      {group.title}
                    </h3>
                  ) : (
                    <div className="my-2 border-t border-border/40" />
                  )}

                  <div className="space-y-1">
                    {visibleItems.map((item) => {
                      const isActive =
                        item.href === "/academics"
                          ? pathname === item.href
                          : pathname === item.href || pathname.startsWith(`${item.href}/`);
                      const Icon = item.icon;
                      const badgeElement = item.badge?.(pendingAdmissions);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => {
                            if (isDrawer && onMobileClose) onMobileClose();
                          }}
                          aria-current={isActive ? "page" : undefined}
                          title={collapsed ? item.label : undefined}
                          className={cn(
                            "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                            isActive
                              ? "bg-primary/10 text-primary font-semibold shadow-sm dark:bg-primary/20"
                              : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                            collapsed ? "justify-center px-2" : "justify-between"
                          )}
                        >
                          {/* Active Left Indicator Bar */}
                          {isActive && (
                            <span
                              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary"
                              aria-hidden="true"
                            />
                          )}

                          <div className="flex items-center gap-3 overflow-hidden">
                            <Icon
                              className={cn(
                                "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110",
                                isActive
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground/80 group-hover:text-foreground"
                              )}
                            />
                            {!collapsed && (
                              <span className="truncate whitespace-nowrap">{item.label}</span>
                            )}
                          </div>

                          {!collapsed && badgeElement && (
                            <div className="shrink-0">{badgeElement}</div>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: User Profile Card & Actions */}
        <div className="border-t border-border/80 p-3">
          {!collapsed ? (
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-2.5 transition-colors hover:bg-muted/70">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-xs text-primary-foreground shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-emerald-500" />
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="truncate text-xs font-semibold text-foreground" title={user.name}>
                    {user.name}
                  </span>
                  <span className="truncate text-[10px] uppercase tracking-wider text-muted-foreground">
                    {user.role.replace("_", " ")}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                <Link
                  href="/school"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                  title="School Profile & Settings"
                  aria-label="Settings"
                >
                  <Settings className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  disabled={isLoggingOut}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div
                className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-xs text-primary-foreground shadow-sm"
                title={`${user.name} (${user.role})`}
              >
                {user.name.charAt(0).toUpperCase()}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full border-2 border-background bg-emerald-500" />
              </div>
              <button
                type="button"
                onClick={() => logout()}
                disabled={isLoggingOut}
                className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Sticky Full-Height Sidebar */}
      <aside
        className={cn(
          "hidden h-screen sticky top-0 shrink-0 border-r border-border/80 bg-card/70 backdrop-blur-md transition-all duration-300 md:block z-40",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <NavContent />
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer Window */}
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-border/80 bg-card shadow-2xl transition-transform duration-300">
            <NavContent isDrawer />
          </aside>
        </div>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Percent,
  School as SchoolIcon,
  TrendingUp,
  Users,
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
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
      { href: "/admissions", label: "Admissions", icon: ClipboardList, visible: canManageAdmissions },
      { href: "/promotions", label: "Promotions", icon: TrendingUp, visible: canManagePromotions },
    ],
  },
  {
    title: "Academic Setup",
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
    title: "Assessments",
    items: [
      { href: "/results", label: "Results & Grading", icon: FileCheck2, visible: canAccessResults },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/school", label: "School Profile", icon: SchoolIcon, visible: canManageSchoolConfig },
    ],
  },
];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <aside className="border-b border-border/80 bg-card/60 backdrop-blur-md md:w-64 md:shrink-0 md:border-b-0 md:border-r">
      <nav className="flex gap-2 overflow-x-auto p-3 md:flex-col md:gap-5 md:p-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => item.visible(user.role));
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.title} className="space-y-1">
              <h3 className="hidden px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 md:block">
                {group.title}
              </h3>
              <div className="flex gap-1 md:flex-col">
                {visibleItems.map((item) => {
                  const isActive =
                    item.href === "/academics"
                      ? pathname === item.href
                      : pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-105",
                          isActive ? "text-primary-foreground" : "text-muted-foreground/80 group-hover:text-foreground"
                        )}
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

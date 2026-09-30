"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  ClipboardList,
  FileCheck2,
  GraduationCap,
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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, visible: () => true },
  { href: "/admissions", label: "Admissions", icon: ClipboardList, visible: canManageAdmissions },
  { href: "/students", label: "Students", icon: GraduationCap, visible: canManageStudents },
  { href: "/results", label: "Results", icon: FileCheck2, visible: canAccessResults },
  { href: "/promotions", label: "Promotions", icon: TrendingUp, visible: canManagePromotions },
  { href: "/staff", label: "Staff", icon: Users, visible: canManageStaff },
  { href: "/school", label: "School Profile", icon: SchoolIcon, visible: canManageSchoolConfig },
  { href: "/academics", label: "Academic Overview", icon: Calendar, visible: canManageStaff },
  {
    href: "/academics/sessions",
    label: "Academic Sessions",
    icon: Calendar,
    visible: canManageSchoolConfig,
  },
  {
    href: "/academics/classes",
    label: "Classes",
    icon: LayoutDashboard,
    visible: canManageSchoolConfig,
  },
  { href: "/academics/subjects", label: "Subjects", icon: BookOpen, visible: canManageSchoolConfig },
  { href: "/settings/grading", label: "Grading", icon: Percent, visible: canManageSchoolConfig },
] satisfies { href: string; label: string; icon: typeof Users; visible: (role: UserRole) => boolean }[];

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const items = NAV_ITEMS.filter((item) => (user ? item.visible(user.role) : false));

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-4">
      {items.map((item) => {
        // Exact match only for "/academics" so its own overview page isn't
        // shown active while on a more specific child route like
        // "/academics/sessions" (which has its own nav entry).
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
              "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

/**
 * There is no separate "My Classes" vs "My Subjects" nav entry: the real
 * backend has exactly one teacher-scope primitive, TeacherAssignment, tying
 * one class to one subject for one session — there is no "class teacher"/
 * "form teacher" concept distinct from a subject assignment (confirmed in
 * the backend's own code comments). One "My Teaching" screen groups and
 * presents that single list rather than duplicating it across two near-
 * identical pages.
 */
export function StaffPortalNav() {
  const pathname = usePathname();
  const { user } = useStaffAuth();
  const isTeaching = user?.staff_type === "TEACHING";

  const items = [
    { href: "/staff-portal/dashboard", label: "Dashboard", icon: LayoutDashboard, visible: true },
    { href: "/staff-portal/assignments", label: "My Teaching", icon: BookOpen, visible: isTeaching },
    { href: "/staff-portal/profile", label: "Profile", icon: UserRound, visible: true },
    { href: "/staff-portal/settings", label: "Settings", icon: Settings, visible: true },
  ].filter((item) => item.visible);

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-4">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
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

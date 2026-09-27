"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Calendar,
  LayoutDashboard,
  Percent,
  School as SchoolIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { canManageSchoolConfig } from "@/lib/auth/permissions";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/school", label: "School Profile", icon: SchoolIcon, adminOnly: true },
  { href: "/academics/sessions", label: "Academic Sessions", icon: Calendar, adminOnly: true },
  { href: "/academics/classes", label: "Classes", icon: LayoutDashboard, adminOnly: true },
  { href: "/academics/subjects", label: "Subjects", icon: BookOpen, adminOnly: true },
  { href: "/settings/grading", label: "Grading", icon: Percent, adminOnly: true },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const canManage = user ? canManageSchoolConfig(user.role) : false;

  const items = NAV_ITEMS.filter((item) => !item.adminOnly || canManage);

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

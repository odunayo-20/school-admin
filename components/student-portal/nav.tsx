"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, FileCheck2, LayoutDashboard, Settings, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/student/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/student/profile", label: "Profile", icon: UserRound },
  { href: "/student/academics", label: "Academics", icon: BookOpen },
  { href: "/student/results", label: "Results", icon: FileCheck2 },
  { href: "/student/settings", label: "Settings", icon: Settings },
] satisfies { href: string; label: string; icon: typeof UserRound }[];

export function StudentPortalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border px-4 py-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:px-3 md:py-4">
      {NAV_ITEMS.map((item) => {
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

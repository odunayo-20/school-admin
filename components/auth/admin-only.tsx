"use client";

import { useAuth } from "@/lib/auth/context";
import { canManageSchoolConfig } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import { EmptyState } from "@/components/data-state";

/**
 * UX-only gate for admin-facing pages (hides the page content for roles
 * that shouldn't normally see it). Not a security boundary — the API is
 * expected to enforce this with a 403 regardless.
 */
export function AdminOnly({
  children,
  check = canManageSchoolConfig,
  title = "You don't have access to this page",
  description = "This area is managed by school administrators.",
}: {
  children: React.ReactNode;
  check?: (role: UserRole) => boolean;
  title?: string;
  description?: string;
}) {
  const { user } = useAuth();

  if (!user || !check(user.role)) {
    return (
      <div className="p-6">
        <EmptyState title={title} description={description} />
      </div>
    );
  }

  return <>{children}</>;
}

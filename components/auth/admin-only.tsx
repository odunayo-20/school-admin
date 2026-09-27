"use client";

import { useAuth } from "@/lib/auth/context";
import { canManageSchoolConfig } from "@/lib/auth/permissions";
import { EmptyState } from "@/components/data-state";

/**
 * UX-only gate for school-configuration pages (hides the form/table for
 * roles that shouldn't normally manage it). Not a security boundary — the
 * API is expected to enforce this with a 403 regardless.
 */
export function AdminOnly({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user || !canManageSchoolConfig(user.role)) {
    return (
      <div className="p-6">
        <EmptyState
          title="You don't have access to this page"
          description="School configuration is managed by school administrators."
        />
      </div>
    );
  }

  return <>{children}</>;
}

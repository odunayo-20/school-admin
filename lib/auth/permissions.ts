import type { UserRole } from "@/lib/auth/types";

/**
 * Frontend-only convenience for hiding actions the user almost certainly
 * can't perform. This is NOT the security boundary — Laravel's own
 * authorization (policies/middleware) is authoritative, and the API is
 * expected to return 403 for anything this misses or gets wrong. Not yet
 * confirmed against real backend authorization rules.
 */
export function canManageSchoolConfig(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

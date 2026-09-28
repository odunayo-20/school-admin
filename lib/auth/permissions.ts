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

/** Staff directory/profile access. Registrars commonly handle HR-adjacent
 * records at schools, so included alongside admins — unconfirmed. */
export function canManageStaff(role: UserRole): boolean {
  return role === "super_admin" || role === "admin" || role === "registrar";
}

/** Granting a staff member login access. Kept to the same roles that can
 * manage staff at all — the actual escalation risk (picking a role) is
 * mitigated in the grant-access form itself, not by further restricting
 * who can open it. */
export function canManageStaffAccounts(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

/** Admissions and student records. Same reasoning as staff — registrars are
 * the natural owners of these at most schools — unconfirmed. */
export function canManageAdmissions(role: UserRole): boolean {
  return role === "super_admin" || role === "admin" || role === "registrar";
}

export function canManageStudents(role: UserRole): boolean {
  return role === "super_admin" || role === "admin" || role === "registrar";
}

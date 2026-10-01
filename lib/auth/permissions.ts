import type { UserRole } from "@/lib/auth/types";

/**
 * Frontend-only convenience for hiding actions the user almost certainly
 * can't perform. This is NOT the security boundary — Laravel's own
 * authorization (policies/middleware) is authoritative, and the API is
 * expected to return 403 for anything this misses or gets wrong. Not yet
 * confirmed against real backend authorization rules.
 */
function norm(role: UserRole | string): string {
  return (role ?? "").toLowerCase();
}

export function canManageSchoolConfig(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin";
}

/** Staff directory/profile access. Registrars commonly handle HR-adjacent
 * records at schools, so included alongside admins — unconfirmed. */
export function canManageStaff(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "registrar";
}

/** Granting a staff member login access. Kept to the same roles that can
 * manage staff at all — the actual escalation risk (picking a role) is
 * mitigated in the grant-access form itself, not by further restricting
 * who can open it. */
export function canManageStaffAccounts(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin";
}

/** Admissions and student records. Same reasoning as staff — registrars are
 * the natural owners of these at most schools — unconfirmed. */
export function canManageAdmissions(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "registrar";
}

export function canManageStudents(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "registrar";
}

/** Entering/submitting results. Teachers (role "staff") own their own
 * batches; admins can also enter/oversee any — unconfirmed. */
export function canEnterResults(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "staff";
}

/** Approve/return/publish. Kept to the same roles as other academic-record
 * oversight — unconfirmed. */
export function canApproveResults(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "registrar";
}

/** Access to the Results area at all (listing/viewing). */
export function canAccessResults(role: UserRole): boolean {
  return canEnterResults(role) || canApproveResults(role);
}

/** Running/reviewing promotions and viewing promotion history. Same
 * reasoning as student records generally — unconfirmed. */
export function canManagePromotions(role: UserRole): boolean {
  const r = norm(role);
  return r === "super_admin" || r === "admin" || r === "registrar";
}


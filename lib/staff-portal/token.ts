/**
 * In-memory only, by design — see lib/student-portal/token.ts for the full
 * rationale (the real backend's own client-integration checklist). A
 * separate module-scoped variable from the student portal's: a staff
 * session and a student session are never the same login, and sharing one
 * in-memory slot between two portals would let one silently clobber the
 * other if both were ever open in the same tab.
 */
let token: string | null = null;

export function getStaffToken(): string | null {
  return token;
}

export function setStaffToken(next: string | null): void {
  token = next;
}

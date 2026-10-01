/**
 * In-memory only, by design. The real backend's own client-integration
 * checklist (docs/api/authentication.md, school-system-api) says it
 * plainly: "store the token in memory (not localStorage if the client is a
 * browser, where any XSS can read it)". A hard refresh loses the session
 * and requires signing in again — a deliberate tradeoff of this backend's
 * stateless design, not something the frontend should paper over with
 * browser storage the backend explicitly warned against.
 */
let token: string | null = null;

export function getStudentToken(): string | null {
  return token;
}

export function setStudentToken(next: string | null): void {
  token = next;
}

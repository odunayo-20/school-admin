/**
 * Laravel authentication endpoint paths.
 *
 * PROPOSED CONTRACT — not yet confirmed against a real Laravel API. Per the
 * project owner's direction (Module 02), the frontend is being built ahead
 * of the backend; these paths follow common Laravel/Sanctum SPA conventions
 * (cookie session, not a bearer token) and should be reconciled once the
 * real API exists. If the real routes differ, only this file needs to
 * change — `lib/auth/api.ts` reads from it exclusively.
 *
 * Assumed:
 *   POST /api/auth/login   { email, password } -> { user: User }
 *   POST /api/auth/logout  -> 204
 *   GET  /api/auth/me      -> User
 */
export const AUTH_ENDPOINTS = {
  login: "/api/auth/login" as string | null,
  logout: "/api/auth/logout" as string | null,
  currentUser: "/api/auth/me" as string | null,
};

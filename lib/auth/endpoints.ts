/**
 * Laravel authentication endpoint paths.
 * Reconciled against the real Laravel API (school-system-api).
 */
export const AUTH_ENDPOINTS = {
  login: "/api/v1/auth/login" as string | null,
  logout: "/api/v1/auth/logout" as string | null,
  currentUser: "/api/v1/auth/me" as string | null,
};


/**
 * CONFIRMED against the real backend (see lib/staff-portal/types.ts) — not a
 * proposal. `env.staffPortalApiUrl` already points at the `/api/v1`-prefixed
 * host, so these are route segments only.
 */
export const STAFF_PORTAL_ENDPOINTS = {
  login: "/api/v1/auth/login",
  logout: "/api/v1/auth/logout",
  me: "/api/v1/auth/me",
  forgotPassword: "/api/v1/auth/forgot-password",

  myAssignments: "/api/v1/teacher-assignments/me",

  academicSessions: "/api/v1/academic-sessions",
  terms: (academicSessionId: number) => `/api/v1/academic-sessions/${academicSessionId}/terms`,

  assessments: "/api/v1/assessments",

  scores: "/api/v1/scores",
  score: (id: number) => `/api/v1/scores/${id}`,

  results: "/api/v1/results",
  resultsBulkCompile: "/api/v1/results/bulk",
  resultSubmit: (id: number) => `/api/v1/results/${id}/submit`,
};

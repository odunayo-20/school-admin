/**
 * CONFIRMED against the real backend (see lib/student-portal/types.ts) — not
 * a proposal. `studentPortalApiUrl` (lib/env.ts) already points at the
 * `/api/v1`-prefixed host, so these are route segments only.
 */
export const STUDENT_PORTAL_ENDPOINTS = {
  login: "/api/v1/auth/login",
  logout: "/api/v1/auth/logout",
  me: "/api/v1/auth/me",
  forgotPassword: "/api/v1/auth/forgot-password",
  resetPassword: "/api/v1/auth/reset-password",
  currentEnrollment: "/api/v1/enrollments/me",
  reportCardHistory: (studentId: number) => `/api/v1/report-cards/students/${studentId}`,
  reportCard: (enrollmentId: number, termId: number) =>
    `/api/v1/report-cards/enrollments/${enrollmentId}/terms/${termId}`,
};

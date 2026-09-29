/**
 * PROPOSED — not confirmed against a real Laravel API. See
 * lib/promotions/types.ts for the domain decisions behind these routes.
 */
export const PROMOTION_ENDPOINTS = {
  candidates: "/api/promotions/candidates",
  bulk: "/api/promotions/bulk",
  history: "/api/promotions",
  studentHistory: (studentId: number) => `/api/students/${studentId}/promotions`,
};

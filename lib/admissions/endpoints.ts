/**
 * PROPOSED — not confirmed against a real Laravel API (none exists in this
 * workspace). Reconcile here first if the real routes differ;
 * `lib/admissions/api.ts` reads from this file exclusively.
 */
export const ADMISSION_ENDPOINTS = {
  admissions: "/api/admissions",
  admission: (id: number) => `/api/admissions/${id}`,
  approve: (id: number) => `/api/admissions/${id}/approve`,
  reject: (id: number) => `/api/admissions/${id}/reject`,
};

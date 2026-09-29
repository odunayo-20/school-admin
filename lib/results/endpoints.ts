/**
 * PROPOSED — not confirmed against a real Laravel API (none exists in this
 * workspace). Reconcile here first if real routes differ; `lib/results/api.ts`
 * reads from this file exclusively.
 */
export const RESULT_ENDPOINTS = {
  batches: "/api/result-batches",
  batch: (id: number) => `/api/result-batches/${id}`,
  entries: (id: number) => `/api/result-batches/${id}/entries`,
  submit: (id: number) => `/api/result-batches/${id}/submit`,
  approve: (id: number) => `/api/result-batches/${id}/approve`,
  return: (id: number) => `/api/result-batches/${id}/return`,
  publish: (id: number) => `/api/result-batches/${id}/publish`,

  studentResults: (studentId: number) => `/api/students/${studentId}/results`,
};

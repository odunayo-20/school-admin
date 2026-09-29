/**
 * PROPOSED — not confirmed against a real Laravel API. Reconcile here
 * first; `lib/students/api.ts` reads from this file exclusively.
 */
export const STUDENT_ENDPOINTS = {
  students: "/api/students",
  student: (id: number) => `/api/students/${id}`,
  status: (id: number) => `/api/students/${id}/status`,

  guardians: (studentId: number) => `/api/students/${studentId}/guardians`,
  guardian: (studentId: number, guardianId: number) =>
    `/api/students/${studentId}/guardians/${guardianId}`,
};

/**
 * PROPOSED, read-only. See lib/enrollment/types.ts for why this exists
 * without a Module 03 backend to confirm it against.
 */
export const ENROLLMENT_ENDPOINTS = {
  classRoster: (classId: number) => `/api/enrollments?school_class_id=${classId}`,
  enrollments: "/api/enrollments",
  studentEnrollments: (studentId: number) => `/api/enrollments?student_id=${studentId}`,
  createEnrollment: "/api/enrollments",
  withdraw: (id: number) => `/api/enrollments/${id}/withdraw`,
  cancel: (id: number) => `/api/enrollments/${id}/cancel`,
};

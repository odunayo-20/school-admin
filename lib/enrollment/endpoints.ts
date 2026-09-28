/**
 * PROPOSED, read-only. See lib/enrollment/types.ts for why this exists
 * without a Module 03 backend to confirm it against.
 */
export const ENROLLMENT_ENDPOINTS = {
  classRoster: (classId: number) => `/api/classes/${classId}/students`,
};

/**
 * PROPOSED endpoint paths for staff management. NOT confirmed against a
 * real Laravel API (none exists in this workspace). When the real backend
 * lands, reconcile routes here first — `lib/staff/api.ts` reads from this
 * file exclusively.
 */
export const STAFF_ENDPOINTS = {
  staff: "/api/staff",
  staffMember: (id: number) => `/api/staff/${id}`,
  staffStatus: (id: number) => `/api/staff/${id}/status`,
  staffAccount: (id: number) => `/api/staff/${id}/account`,

  classAssignments: (staffId: number) => `/api/staff/${staffId}/class-assignments`,
  createClassAssignment: "/api/class-teacher-assignments",
  deleteClassAssignment: (id: number) => `/api/class-teacher-assignments/${id}`,

  subjectAssignments: (staffId: number) => `/api/staff/${staffId}/subject-assignments`,
  createSubjectAssignment: "/api/subject-teacher-assignments",
  deleteSubjectAssignment: (id: number) => `/api/subject-teacher-assignments/${id}`,

  // Reverse (class-scoped) lookups for Module 05's academic view — read-only,
  // assignment creation/removal stays on the staff profile (Module 04).
  classTeachersForClass: (classId: number) => `/api/classes/${classId}/class-teacher-assignments`,
  subjectTeachersForClass: (classId: number) => `/api/classes/${classId}/subject-teacher-assignments`,
};

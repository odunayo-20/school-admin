/**
 * Module 03 — Staff Endpoints
 * Routes confirmed against Laravel api.php:
 *  GET/POST  /api/v1/staff
 *  GET/PUT   /api/v1/staff/{staff}
 *  POST      /api/v1/staff/{staff}/activate
 *  POST      /api/v1/staff/{staff}/deactivate
 *  GET/POST  /api/v1/staff/{staff}/class-assignments
 *  DELETE    /api/v1/class-teacher-assignments/{id}
 *  GET/POST  /api/v1/staff/{staff}/subject-assignments
 *  DELETE    /api/v1/subject-teacher-assignments/{id}
 */
export const STAFF_ENDPOINTS = {
  staff: "/api/staff",
  myProfile: "/api/staff/me",
  staffMember: (id: number) => `/api/staff/${id}`,
  activate: (id: number) => `/api/staff/${id}/activate`,
  deactivate: (id: number) => `/api/staff/${id}/deactivate`,

  // Legacy — maps to activate/deactivate
  staffStatus: (id: number) => `/api/staff/${id}/status`,
  staffAccount: (id: number) => `/api/staff/${id}/account`,

  classAssignments: (staffId: number) => `/api/staff/${staffId}/class-assignments`,
  createClassAssignment: "/api/class-teacher-assignments",
  deleteClassAssignment: (id: number) => `/api/class-teacher-assignments/${id}`,

  subjectAssignments: (staffId: number) => `/api/staff/${staffId}/subject-assignments`,
  createSubjectAssignment: "/api/subject-teacher-assignments",
  deleteSubjectAssignment: (id: number) => `/api/subject-teacher-assignments/${id}`,

  classTeachersForClass: (classId: number) => `/api/classes/${classId}/class-teacher-assignments`,
  subjectTeachersForClass: (classId: number) => `/api/classes/${classId}/subject-teacher-assignments`,
};

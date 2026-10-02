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

  // Module 08 — Teacher Assignments
  teacherAssignments: "/api/teacher-assignments",
  teacherAssignment: (id: number) => `/api/teacher-assignments/${id}`,
  endTeacherAssignment: (id: number) => `/api/teacher-assignments/${id}/end`,
  cancelTeacherAssignment: (id: number) => `/api/teacher-assignments/${id}/cancel`,

  // Legacy — maps to activate/deactivate
  staffStatus: (id: number) => `/api/staff/${id}/status`,

  // Aliases for compatibility with legacy queries
  classAssignments: (staffId: number) => `/api/teacher-assignments?teaching_staff_id=${staffId}`,
  createClassAssignment: "/api/teacher-assignments",
  deleteClassAssignment: (id: number) => `/api/teacher-assignments/${id}/cancel`,

  subjectAssignments: (staffId: number) => `/api/teacher-assignments?teaching_staff_id=${staffId}`,
  createSubjectAssignment: "/api/teacher-assignments",
  deleteSubjectAssignment: (id: number) => `/api/teacher-assignments/${id}/cancel`,

  classTeachersForClass: (_classId: number) => `/api/teacher-assignments`,
  subjectTeachersForClass: (_classId: number) => `/api/teacher-assignments`,
};


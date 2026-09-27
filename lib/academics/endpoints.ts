/**
 * PROPOSED endpoint paths for school configuration & academic foundation.
 * NOT confirmed against a real Laravel API (none exists in this workspace
 * yet) — built ahead per the project owner's direction. When the real
 * backend lands, reconcile routes here first; `lib/academics/api.ts` reads
 * from this file exclusively, so callers shouldn't need to change.
 */
export const ACADEMIC_ENDPOINTS = {
  school: "/api/school",

  academicSessions: "/api/academic-sessions",
  academicSession: (id: number) => `/api/academic-sessions/${id}`,
  activateAcademicSession: (id: number) => `/api/academic-sessions/${id}/activate`,

  terms: (sessionId: number) => `/api/academic-sessions/${sessionId}/terms`,
  term: (id: number) => `/api/terms/${id}`,

  classes: "/api/classes",
  class: (id: number) => `/api/classes/${id}`,

  sections: (classId: number) => `/api/classes/${classId}/sections`,
  section: (id: number) => `/api/sections/${id}`,

  subjects: "/api/subjects",
  subject: (id: number) => `/api/subjects/${id}`,

  classSubjects: (classId: number) => `/api/classes/${classId}/subjects`,
  classSubject: (classId: number, subjectId: number) =>
    `/api/classes/${classId}/subjects/${subjectId}`,

  gradingScales: "/api/grading-scales",
  gradingScale: (id: number) => `/api/grading-scales/${id}`,
};

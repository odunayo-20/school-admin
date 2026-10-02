/**
 * PROPOSED endpoint paths for school configuration & academic foundation.
 * NOT confirmed against a real Laravel API (none exists in this workspace
 * yet) — built ahead per the project owner's direction. When the real
 * backend lands, reconcile routes here first; `lib/academics/api.ts` reads
 * from this file exclusively, so callers shouldn't need to change.
 */
export const ACADEMIC_ENDPOINTS = {
  school: "/api/school",
  academicContext: "/api/academic-context",

  academicSessions: "/api/academic-sessions",
  academicSession: (id: number) => `/api/academic-sessions/${id}`,
  activateAcademicSession: (id: number) => `/api/academic-sessions/${id}/activate`,
  deleteAcademicSession: (id: number) => `/api/academic-sessions/${id}`,

  terms: (sessionId: number) => `/api/academic-sessions/${sessionId}/terms`,
  term: (id: number) => `/api/terms/${id}`,
  activateTerm: (id: number) => `/api/terms/${id}/activate`,
  deleteTerm: (id: number) => `/api/terms/${id}`,

  classLevels: "/api/class-levels",
  classLevel: (id: number) => `/api/class-levels/${id}`,

  classes: "/api/classes",
  class: (id: number) => `/api/classes/${id}`,

  sections: "/api/sections",
  section: (id: number) => `/api/sections/${id}`,

  subjects: "/api/subjects",
  subject: (id: number) => `/api/subjects/${id}`,

  classSubjects: "/api/class-subjects",
  classSubject: (id: number) => `/api/class-subjects/${id}`,

  gradingScales: "/api/grading-scales",
  gradingScale: (id: number) => `/api/grading-scales/${id}`,
  calculateGrade: (id: number) => `/api/grading-scales/${id}/calculate`,
};


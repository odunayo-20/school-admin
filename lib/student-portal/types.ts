/**
 * Module 09 (Student Portal) — CONNECTED to the real Laravel backend
 * (odunayo-20/school-system-api), same as Module 08. Every shape below was
 * copied from a live response, not proposed — the backend was run locally,
 * a real student login was linked, and every endpoint here was actually
 * called end-to-end before this file was written.
 *
 * Two small, additive backend changes were made to unblock this module —
 * both committed on the backend's own `claude/result-checker-public-endpoints`
 * branch, following the exact reasoning the backend's own code comments had
 * already laid out ("profile.* is Module 01's self-service pair", "the
 * link is reserved for the portal module"):
 *
 *  1. `UserResource` now exposes a `student` field (id, student_number,
 *     full_name) when the caller's role is STUDENT — the same conditional
 *     pattern already used for `staff_type` on a STAFF caller. Without
 *     this, an authenticated student had no way to discover their own
 *     linked Student id at all.
 *  2. A new `GET /enrollments/me` — the caller's own ACTIVE enrollment for
 *     the current academic session, gated by nothing but `auth:api` +
 *     `active` (no permission needed: "me" can only ever answer with the
 *     caller's own record, the same reasoning `/auth/me` already uses).
 *     Reuses `EnrollmentResource` unchanged.
 *
 * Everything else here — results, promotion, profile editing, documents,
 * in-session password change — is either read through an EXISTING
 * authenticated endpoint the backend already scopes to "your own" (report
 * cards), or is a confirmed gap with no endpoint at all (see the Module 09
 * report). Nothing here recomputes a grade, an average, or an
 * authorization decision — every value is rendered exactly as returned.
 */

export interface StudentIdentity {
  id: number;
  student_number: string;
  full_name: string;
}

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string | null;
  /** Present only when role is STUDENT — see UserResource. Null if a
   * STUDENT-role account exists with no linked Student row yet. */
  student: StudentIdentity | null;
  email_verified: boolean;
  last_login_at: string | null;
  permissions: string[];
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResult {
  user: CurrentUser;
  token: string;
  token_type: string;
  expires_at: string;
}

export interface AcademicSessionRef {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
}

export interface SchoolClassRef {
  id: number;
  name: string;
  code: string;
}

export interface SectionRef {
  id: number;
  name: string;
  code: string;
}

export interface TermRef {
  id: number;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
  academic_session: { id: number; name: string; status: string };
}

/** The full StudentResource, as nested inside an enrollment — the only
 * place a student's own date of birth/gender/status is available to them,
 * since there is no dedicated profile endpoint (see the Module 09 report). */
export interface EnrolledStudent {
  id: number;
  student_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  status: string;
  account_status: string | null;
}

export interface CurrentEnrollment {
  id: number;
  student: EnrolledStudent;
  academic_session: AcademicSessionRef;
  school_class: SchoolClassRef;
  section: SectionRef | null;
  enrollment_date: string;
  status: string;
  notes: string | null;
}

export interface ReportCardSubjectResult {
  result_id: number;
  class_subject: {
    subject: { id: number; name: string; code: string };
  };
  percentage: string;
  grade: string | null;
  grade_point: string | null;
  remark: string | null;
  status: string;
}

export interface ReportCardSummary {
  subjects_count: number;
  overall_percentage: string;
  average_grade_point: string | null;
}

/** GET /report-cards/enrollments/{enrollment}/terms/{term} */
export interface ReportCard {
  enrollment: CurrentEnrollment;
  term: TermRef;
  subjects: ReportCardSubjectResult[];
  summary: ReportCardSummary;
}

/** One row of GET /report-cards/students/{student} (history, paginated). */
export interface ReportCardHistoryItem {
  enrollment: CurrentEnrollment;
  term: TermRef;
  subjects_count: number;
  overall_percentage: string;
  average_grade_point: string | null;
}

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
  };
}

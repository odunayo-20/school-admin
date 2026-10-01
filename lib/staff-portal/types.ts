/**
 * Module 10 (Staff/Teacher Portal) — CONNECTED to the real Laravel backend
 * (odunayo-20/school-system-api), same as Modules 08-09. Every shape below was
 * confirmed against the actual source (controllers, services, resources,
 * seeders, Pest tests) before being typed here, not proposed.
 *
 * Three small, additive backend changes were made to unblock this module —
 * all committed on the backend's own branch, following the exact precedent
 * Module 09 already set (a self-scoped "me" endpoint gated by nothing but
 * auth:api + active) and the backend's own anticipated-but-undone design
 * (AssessmentPermissionSeeder's own comment: "Knowing which assessments
 * exist for the class subjects THEY are assigned to teach is a future
 * Assessment Scores module's question" — this module is that module):
 *
 *  1. `GET /teacher-assignments/me` — the caller's own teaching assignments,
 *     never a client-supplied teaching_staff_id. There is no generic
 *     self-discovery of "what do I teach" otherwise: the plain
 *     `teacher_assignments.view` permission is withheld from STAFF
 *     entirely (role-level), so the ordinary list endpoint 403s for every
 *     teacher.
 *  2. STAFF now holds `assessments.view`, scoped in AssessmentService to
 *     only class subjects the caller holds an ACTIVE TeacherAssignment for
 *     — the identical ownership check ScoreService/ResultService already
 *     apply to scores/results. Without this, a teacher could record scores
 *     (scores.create was already granted) but never discover which
 *     assessments exist to record them against.
 *  3. No change needed for `staff_type` — UserResource already exposes it
 *     for a STAFF caller, mirroring the `student` field it exposes for a
 *     STUDENT caller.
 *
 * CONFIRMED BACKEND GAPS (see the Module 10 report for the full reasoning —
 * these are NOT faked anywhere in this module):
 *  - No staff self-service profile endpoint. `staff.view` is withheld from
 *    STAFF entirely (even for their own record), and UserResource carries
 *    no nested "staff" object the way it does a "student" one. Profile is
 *    therefore limited to whatever /auth/me itself returns.
 *  - `students.view`/`enrollments.view` are both withheld from STAFF
 *    entirely, with no per-class scoping anywhere in the backend. A
 *    standalone "class roster" browse is not buildable; a roster only
 *    becomes visible through the enrollments nested inside already-scoped
 *    Score/Result rows (see ResultService::compileClassSubject(), which
 *    doubles as the only backend-sanctioned way to discover enrollment ids
 *    for a class subject in the first place).
 *  - Report cards are permanently and deliberately withheld from STAFF —
 *    both by permission and by a hard-coded service exception, even for a
 *    teacher assigned to a subject on that exact card. Not built here.
 */

export interface CurrentUser {
  id: number;
  name: string;
  email: string;
  status: string;
  role: string | null;
  /** Present only when role is STAFF — see UserResource. */
  staff_type: "TEACHING" | "NON_TEACHING" | null;
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

export interface TermRef {
  id: number;
  academic_session_id: number;
  academic_session: { id: number; name: string; status: string } | null;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  status: string;
  is_current: boolean;
}

export interface SchoolClassRef {
  id: number;
  class_level_id: number;
  name: string;
  code: string;
  sort_order: number;
  status: string;
}

export interface SubjectRef {
  id: number;
  name: string;
  code: string;
  sort_order: number;
  status: string;
}

export interface ClassSubjectRef {
  id: number;
  school_class: SchoolClassRef;
  subject: SubjectRef;
  status: string;
}

export interface StaffRef {
  id: number;
  staff_number: string | null;
  name: string;
  email: string;
  staff_type: "TEACHING" | "NON_TEACHING";
  designation: string | null;
  employment_date: string | null;
  phone: string | null;
  status: string;
  account_status: string;
}

export type TeacherAssignmentStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export interface TeacherAssignment {
  id: number;
  teaching_staff: StaffRef;
  class_subject: ClassSubjectRef;
  academic_session: AcademicSessionRef;
  status: TeacherAssignmentStatus;
  notes: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentTypeRef {
  id: number;
  name: string;
  code: string;
}

export interface Assessment {
  id: number;
  class_subject: ClassSubjectRef;
  term: TermRef;
  assessment_type: AssessmentTypeRef;
  name: string;
  /** Decimal string, as the backend casts it — never parsed to float for display math. */
  max_score: string;
  weight: string | null;
  sort_order: number;
  status: string;
}

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

export interface EnrollmentRef {
  id: number;
  student: EnrolledStudent;
  academic_session: AcademicSessionRef;
  school_class: SchoolClassRef;
  section: { id: number; name: string; code: string } | null;
  enrollment_date: string;
  status: string;
  notes: string | null;
}

export interface Score {
  id: number;
  score: string;
  max_score: string | null;
  score_percentage: number | null;
  remarks: string | null;
  assessment: Assessment;
  enrollment: EnrollmentRef;
  created_at: string;
  updated_at: string;
}

export type ResultStatus = "INCOMPLETE" | "COMPILED" | "SUBMITTED" | "APPROVED" | "PUBLISHED" | "LOCKED";

export interface ResultActor {
  id: number;
  name: string;
}

export interface Result {
  id: number;
  enrollment: EnrollmentRef;
  class_subject: ClassSubjectRef;
  term: TermRef;
  percentage: string | null;
  grade: string | null;
  grade_point: string | null;
  remark: string | null;
  status: ResultStatus;
  submitted_by: ResultActor | null;
  submitted_at: string | null;
  approved_by: ResultActor | null;
  approved_at: string | null;
  published_by: ResultActor | null;
  published_at: string | null;
  locked_by: ResultActor | null;
  locked_at: string | null;
  created_at: string;
  updated_at: string;
}

/** One row of POST /results/bulk — compiling a whole class subject + term at once. */
export interface BulkCompileOutcome {
  enrollment_id: number;
  result: Result | null;
  error: string | null;
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

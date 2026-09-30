/**
 * Module 08 (Public Result Checker) — CONNECTED to the real Laravel backend
 * (odunayo-20/school-system-api, its own "Module 16 — Result Checker").
 * Everything below is verified against a live instance, not proposed:
 * `POST /api/v1/result-checker` was exercised end-to-end (a full
 * class/subject/assessment/score/compile/submit/approve/publish pipeline,
 * then the checker itself) and every shape here is copied from the real
 * response, not invented. This is the first module in this project to
 * leave "proposed contract" status.
 *
 * Key facts confirmed against the real API (not decisions made here):
 *  - The credential is `student_number` + `date_of_birth` + `term_id` — NOT
 *    a PIN. The backend's own docs explain why: a PIN is a value this
 *    project would have to generate, store and hand to a parent somehow
 *    (no notification/printing module exists to do that), whereas a date
 *    of birth is something a parent already knows.
 *  - `term_id` is a required opaque integer, and there is deliberately NO
 *    public endpoint to list sessions/terms (every Module 02 academic
 *    endpoint requires a bearer token + permission). This is a genuine
 *    backend gap — see the Module 08 report. The frontend copes by reading
 *    a `?term=` URL query param (a school can share a direct link for "my
 *    child's First Term result") and otherwise asking for it directly with
 *    an explanatory hint, rather than pretending a picker exists.
 *  - EVERY failure reason — unknown student_number, a date of birth that
 *    doesn't match, no enrollment in that term's session, or a result that
 *    isn't PUBLISHED/LOCKED yet — collapses to the exact same 404
 *    `{"message":"Resource not found."}`. Confirmed empirically: a wrong
 *    date of birth and an unknown student number return byte-identical
 *    bodies. The frontend never tries to distinguish them.
 *  - The response is `ReportCardResource` verbatim — the SAME resource
 *    Module 14's authenticated report-card endpoints use, populated via
 *    `ReportCardService::forEnrollmentAndTermUnguarded()`. There is no
 *    separate "public result" format and no second calculation engine.
 *  - No `school` object is present anywhere in this response (confirmed
 *    live) — there is also no public `GET /school` endpoint (it requires
 *    `permission:school.view`). The checker page therefore cannot show the
 *    school's real name/address; see the Module 08 report.
 *  - No per-assessment (CA/Exam) breakdown — deliberately, per the
 *    backend's own docs: Score remains the sole authoritative source, and a
 *    breakdown is only available through an authenticated `GET /scores`
 *    call. Only `percentage`, `grade`, `grade_point` and `remark` per
 *    subject are shown here.
 *  - `percentage`, `grade_point`, `overall_percentage` and
 *    `average_grade_point` are decimal strings ("85.00"), not numbers — the
 *    backend's own convention to avoid float rounding. Rendered as-is,
 *    never parsed and re-computed.
 *
 * Only the fields this module actually displays are typed below. The real
 * response also carries internal ids, timestamps and `account_status` on
 * nested resources (confirmed live) that are deliberately never surfaced
 * in a public-facing document, even though they arrive in the payload.
 */

export interface ResultCheckRequest {
  student_number: string;
  /** ISO date string, YYYY-MM-DD — matches a native `<input type="date">`. */
  date_of_birth: string;
  term_id: number;
}

export interface VerifiedResult {
  enrollment: {
    student: {
      full_name: string;
      student_number: string;
      date_of_birth: string;
      gender: string | null;
    };
    academic_session: { name: string };
    school_class: { name: string };
    section: { name: string } | null;
  };
  term: {
    name: string;
    term_number: number;
  };
  subjects: Array<{
    result_id: number;
    class_subject: {
      subject: { name: string; code: string };
    };
    /** Decimal string, e.g. "85.00" — never parsed or recomputed. */
    percentage: string;
    grade: string | null;
    grade_point: string | null;
    remark: string | null;
    /** "PUBLISHED" or "LOCKED" — the only two statuses this endpoint can
     * ever return, per the backend's own availability gate. */
    status: string;
  }>;
  summary: {
    subjects_count: number;
    overall_percentage: string;
    average_grade_point: string | null;
  };
}

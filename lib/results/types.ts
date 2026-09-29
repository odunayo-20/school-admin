/**
 * PROPOSED CONTRACT for Module 06 (Results & Assessment Management). No
 * Laravel backend exists in this workspace — built ahead per the project
 * owner's direction, same as every prior module.
 *
 * Key domain decisions:
 *  - A result is modeled as a BATCH (one academic_session + term + class +
 *    section + subject + teacher context) containing one entry per enrolled
 *    student, not a flat per-student-per-subject record. Submission,
 *    approval, and publishing all act on the whole batch at once, matching
 *    how these workflows actually operate at a school.
 *  - Assessment breakdown is CA + Exam -> Total, chosen because it's the
 *    near-universal convention for this style of school system and lines
 *    up with Module 02's GradingScale already assuming a 0-100 total.
 *    UNCONFIRMED — reconcile field names once the real API exists.
 *  - Grading is entirely backend-owned: the frontend sends raw ca_score/
 *    exam_score and only ever displays total_score/grade/grade_point/
 *    remark as returned by the API (assumed derived via Module 02's
 *    GradingScale). No grading algorithm is implemented here.
 *  - Workflow: draft -> submitted -> returned -> approved -> published.
 *    "Locked" is intentionally NOT modeled as a separate status — published
 *    is treated as immutable. This is a scope simplification, not a
 *    confirmed backend rule; revisit once the real workflow is known.
 *  - No position/ranking — that requires cross-student comparison logic
 *    that belongs to the backend; omitted rather than invented.
 */

export type ResultBatchStatus = "draft" | "submitted" | "returned" | "approved" | "published";

interface ResultBatchContext {
  academic_session: { id: number; name: string };
  term: { id: number; name: string };
  class: { id: number; name: string };
  section: { id: number; name: string } | null;
  subject: { id: number; name: string; code: string };
}

export interface ResultBatch extends ResultBatchContext {
  id: number;
  teacher: { id: number; name: string } | null;
  status: ResultBatchStatus;
  student_count: number;
  submitted_at: string | null;
  approved_at: string | null;
  published_at: string | null;
  return_reason: string | null;
}

export interface ResultEntry {
  id: number;
  student: { id: number; name: string; student_no: string };
  ca_score: number | null;
  exam_score: number | null;
  total_score: number | null;
  grade: string | null;
  grade_point: number | null;
  remark: string | null;
}

export interface ResultBatchDetail extends ResultBatch {
  entries: ResultEntry[];
}

export interface ResultBatchFilters {
  academic_session_id?: number;
  term_id?: number;
  class_id?: number;
  section_id?: number;
  subject_id?: number;
  status?: ResultBatchStatus;
  /** Restrict to the current user's own batches (teacher view). */
  mine?: boolean;
  page?: number;
}

export interface CreateResultBatchInput {
  academic_session_id: number;
  term_id: number;
  class_id: number;
  section_id: number | null;
  subject_id: number;
}

export interface ResultEntryInput {
  student_id: number;
  ca_score: number | null;
  exam_score: number | null;
}

/** A student's own published results — read-only, surfaced on the
 * student profile (Module 03). Never exposes draft/unpublished data. */
export interface StudentResult {
  id: number;
  academic_session: { id: number; name: string };
  term: { id: number; name: string };
  subject: { id: number; name: string; code: string };
  total_score: number | null;
  grade: string | null;
  remark: string | null;
}

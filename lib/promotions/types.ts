/**
 * PROPOSED CONTRACT for Module 07 (Promotion & Student Progression). No
 * Laravel backend exists in this workspace — built ahead per the project
 * owner's direction, same as every prior module.
 *
 * Key domain decisions:
 *  - Promotion is NOT a second enrollment mechanism. Executing a promotion
 *    is a single atomic backend action that itself manages Module 03's
 *    Enrollment records (completes the old one, creates the new one) and,
 *    for graduates, Student.status — the frontend never calls the
 *    enrollment endpoints directly as part of this flow.
 *  - Eligibility is entirely backend-owned, assumed derived from Module 06's
 *    published results. The frontend only ever displays `eligibility` and
 *    `eligibility_note` as returned by the API — it does not compute an
 *    average, a pass mark, or any other derived academic judgement.
 *    UNCONFIRMED — reconcile once the real eligibility rule exists.
 *  - Three decisions per student: "promote" (to the next class, using
 *    Module 02's existing SchoolClass.order — no separate "next class"
 *    concept invented), "repeat" (same class, new session), "graduate" (no
 *    new enrollment). The backend suggests a default via
 *    `suggested_decision`/`suggested_class`; staff can override any row
 *    before executing.
 *  - Review-before-execute is a client-side wizard, not a persisted
 *    draft/submitted workflow like Module 06's results — there is no
 *    multi-actor handoff here, so nothing is saved until the single bulk
 *    execute call. What IS persisted is PromotionRecord, an immutable
 *    per-student audit row, which is what "promotion history" reads (both
 *    on the student profile and a school-wide log).
 *  - Individual promotion (from a student's own profile) reuses the exact
 *    same bulk endpoint with a one-item decisions array — no separate
 *    "single promotion" endpoint.
 */

export type PromotionDecision = "promote" | "repeat" | "graduate";
export type EligibilityStatus = "eligible" | "not_eligible" | "unknown";

export interface PromotionCandidate {
  student: { id: number; name: string; student_no: string };
  enrollment_id: number;
  eligibility: EligibilityStatus;
  /** Backend-authored explanation, e.g. "Average 42% across published
   * results" or "No published results for this session yet." Never
   * generated on the frontend. */
  eligibility_note: string | null;
  suggested_decision: PromotionDecision;
  suggested_class: { id: number; name: string } | null;
}

export interface PromotionCandidateFilters {
  academic_session_id: number;
  class_id: number;
  section_id?: number;
}

export interface PromotionDecisionInput {
  student_id: number;
  enrollment_id: number;
  decision: PromotionDecision;
  to_class_id: number | null;
  to_section_id: number | null;
}

export interface BulkPromotionInput {
  from_academic_session_id: number;
  /** Null when every included decision is "graduate" — no new enrollment
   * needs a target session in that case. */
  to_academic_session_id: number | null;
  decisions: PromotionDecisionInput[];
}

export interface PromotionRecord {
  id: number;
  student: { id: number; name: string; student_no: string };
  decision: PromotionDecision;
  from_academic_session: { id: number; name: string };
  from_class: { id: number; name: string };
  from_section: { id: number; name: string } | null;
  to_academic_session: { id: number; name: string } | null;
  to_class: { id: number; name: string } | null;
  to_section: { id: number; name: string } | null;
  promoted_by: { id: number; name: string } | null;
  promoted_at: string;
}

export interface PromotionHistoryFilters {
  student_id?: number;
  academic_session_id?: number;
  class_id?: number;
  decision?: PromotionDecision;
  page?: number;
}

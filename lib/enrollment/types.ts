/**
 * PROPOSED CONTRACT. No Laravel backend exists in this workspace — built
 * ahead per the project owner's direction. Module 03 now owns this file in
 * full (it started in Module 05 as an explicitly read-only roster stopgap;
 * that roster contract is unchanged below, and real Enrollment CRUD has
 * been added alongside it).
 */

export type EnrollmentStatus = "active" | "completed" | "withdrawn" | "cancelled";

export interface Enrollment {
  id: number;
  student?: {
    id: number;
    name?: string;
    full_name?: string;
    student_no?: string;
    student_number?: string;
  };
  academic_session: { id: number; name: string };
  class?: { id: number; name: string };
  school_class?: { id: number; name: string };
  section: { id: number; name: string } | null;
  status: EnrollmentStatus;
  enrollment_date: string;
}

export interface EnrollmentInput {
  student_id: number;
  academic_session_id: number;
  class_id: number;
  section_id: number | null;
}

// --- Class roster (read-only; see components/academics/class-roster.tsx) ---

export interface RosterStudent {
  id: number;
  student_no: string;
  name: string;
  section: { id: number; name: string } | null;
  enrollment_status: "active" | "inactive";
}

export interface RosterFilters {
  academic_session_id: number;
  section_id?: number;
  search?: string;
  page?: number;
}

import type { Gender } from "@/lib/admissions/types";

/**
 * PROPOSED CONTRACT — see lib/admissions/types.ts for the overall lifecycle
 * this fits into. A Student is a distinct entity from the Admission that
 * produced it, and from the Enrollment record(s) that place it into a
 * class over time (see lib/enrollment).
 */

export type StudentStatus = "active" | "inactive" | "graduated" | "withdrawn";
export type GuardianRelationship = "father" | "mother" | "guardian";

export interface Guardian {
  id: number;
  name: string;
  relationship: GuardianRelationship;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface GuardianInput {
  name: string;
  relationship: GuardianRelationship;
  phone: string | null;
  email: string | null;
  address: string | null;
}

export interface CurrentEnrollmentSummary {
  id: number;
  academic_session: { id: number; name: string };
  class: { id: number; name: string };
  section: { id: number; name: string } | null;
}

export interface Student {
  id: number;
  student_no: string;
  name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  status: StudentStatus;
  admission_id: number | null;
  current_enrollment: CurrentEnrollmentSummary | null;
  guardians: Guardian[];
  created_at: string;
}

export interface StudentListItem {
  id: number;
  student_no: string;
  name: string;
  status: StudentStatus;
  current_enrollment: CurrentEnrollmentSummary | null;
}

export interface StudentFilters {
  search?: string;
  status?: StudentStatus;
  class_id?: number;
  section_id?: number;
  page?: number;
}

export interface StudentPersonalInput {
  name: string;
  date_of_birth: string | null;
  gender: Gender | null;
}

import type { AcademicSession, ClassLevel } from "@/lib/academics/types";
import type { Student } from "@/lib/students/types";

/**
 * Module 05 — Admission Management
 * Matches Laravel backend:
 * Models: Admission
 * Enums: AdmissionStatus ("PENDING", "ADMITTED", "REJECTED", "WITHDRAWN")
 * Endpoints: GET /admissions, POST /admissions, GET /admissions/{id},
 *            PUT /admissions/{id}, POST /admissions/{id}/admit,
 *            POST /admissions/{id}/reject, POST /admissions/{id}/withdraw
 */

export type Gender = "male" | "female" | "MALE" | "FEMALE";

export type AdmissionStatus =
  | "PENDING"
  | "ADMITTED"
  | "REJECTED"
  | "WITHDRAWN"
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

export interface Admission {
  id: number;
  admission_number: string;
  first_name: string;
  middle_name: string | null;
  last_name: string | null;
  full_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  status: AdmissionStatus;
  notes: string | null;
  decided_at: string | null;
  academic_session?: AcademicSession | null;
  entry_class_level?: ClassLevel | null;
  student?: Student | null;
  created_at: string;
  updated_at?: string;

  // Compatibility aliases
  admission_no?: string;
  applicant_name?: string;
  application_date?: string;
  student_id?: number | null;
  intended_class?: { id: number; name: string } | null;
  previous_school?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
}

export type AdmissionListItem = Admission;

export interface AdmissionFilters {
  search?: string;
  status?: string;
  academic_session_id?: number;
  entry_class_level_id?: number;
  page?: number;
  per_page?: number;
}

export interface AdmissionInput {
  first_name: string;
  middle_name?: string | null;
  last_name?: string | null;
  date_of_birth?: string | null;
  gender?: Gender | null;
  academic_session_id: number;
  entry_class_level_id?: number | null;
  admission_number?: string | null;
  notes?: string | null;

  // Compatibility fields accepted during input conversion
  applicant_name?: string;
  intended_class_id?: number | null;
  previous_school?: string | null;
  guardian_name?: string | null;
  guardian_phone?: string | null;
  guardian_email?: string | null;
}

export interface AdmissionDecisionInput {
  notes?: string | null;
}

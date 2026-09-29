/**
 * PROPOSED CONTRACT for Module 03 (Admissions, Students & Enrollment). No
 * Laravel backend exists in this workspace — built ahead per the project
 * owner's direction, same as Modules 02/04/05.
 *
 * Lifecycle assumed: Applicant applies -> Admission record (pending) ->
 * approve (creates a Student) or reject. Admissions and Students are
 * deliberately separate entities — an admission is a historical
 * application record, not the student itself.
 */

export type Gender = "male" | "female";
export type AdmissionStatus = "pending" | "approved" | "rejected";

export interface Admission {
  id: number;
  admission_no: string;
  applicant_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  intended_class: { id: number; name: string } | null;
  previous_school: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  status: AdmissionStatus;
  application_date: string;
  /** Set once approved and converted into a Student record. */
  student_id: number | null;
}

export type AdmissionListItem = Pick<
  Admission,
  "id" | "admission_no" | "applicant_name" | "application_date" | "status" | "intended_class"
>;

export interface AdmissionFilters {
  search?: string;
  status?: AdmissionStatus;
  page?: number;
}

export interface AdmissionInput {
  applicant_name: string;
  date_of_birth: string | null;
  gender: Gender | null;
  intended_class_id: number | null;
  previous_school: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
}

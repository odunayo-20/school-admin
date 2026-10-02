/**
 * Module 03 — Staff Management
 * Reconciled against real Laravel backend:
 *   - StaffResource: id, staff_number, name, email, staff_type, designation,
 *     employment_date, phone, status, account_status, created_at, updated_at
 *   - StaffType enum: "TEACHING" | "NON_TEACHING"
 *   - EmploymentStatus enum: "ACTIVE" | "INACTIVE" | "TERMINATED"
 *   - StoreStaffRequest: name, email, password, password_confirmation,
 *     staff_type (required), staff_number?, employment_date?, phone?, designation?
 *   - UpdateStaffRequest: same employment fields + optional status
 *   - activate: POST /staff/{id}/activate
 *   - deactivate: POST /staff/{id}/deactivate
 */

export type StaffType = "TEACHING" | "NON_TEACHING";
export type EmploymentStatus = "ACTIVE" | "INACTIVE" | "TERMINATED";

// Legacy aliases for backward compat
export type StaffStatus = EmploymentStatus | "active" | "inactive";
export type EmploymentType = "full_time" | "part_time" | "contract";

export interface Staff {
  id: number;
  staff_number: string;
  // name/email live on the linked User account
  name: string | null;
  email: string | null;
  staff_type: StaffType;
  designation: string | null;
  employment_date: string | null;
  phone: string | null;
  status: EmploymentStatus | string;
  account_status: string | null;
  created_at: string;
  updated_at?: string;

  // Legacy aliases (may be present for backward compat)
  staff_no?: string;
  is_teacher?: boolean;
  employment_type?: EmploymentType;
  date_joined?: string | null;
  account?: { id: number; email: string; role: string } | null;
}

export type StaffListItem = Staff;

export interface StaffFilters {
  search?: string;
  status?: string;
  staff_type?: StaffType;
  /** Legacy compat — mapped to staff_type */
  employment_type?: EmploymentType;
  is_teacher?: boolean;
  page?: number;
}

/** Payload for POST /api/staff (create) */
export interface StaffCreateInput {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  staff_type: StaffType;
  staff_number?: string | null;
  employment_date?: string | null;
  phone?: string | null;
  designation?: string | null;
}

/** Payload for PUT /api/staff/{id} (update) */
export interface StaffUpdateInput {
  name: string;
  email: string;
  staff_type: StaffType;
  staff_number?: string | null;
  employment_date?: string | null;
  phone?: string | null;
  designation?: string | null;
  status?: EmploymentStatus;
}

/** Legacy alias kept for backward compatibility with existing form components */
export type StaffInput = StaffUpdateInput & {
  // Legacy form fields mapped during submission
  is_teacher?: boolean;
  date_joined?: string | null;
  employment_type?: EmploymentType;
};

export interface GrantAccountInput {
  email: string;
  role: string;
}

interface AssignmentRefs {
  academic_session: { id: number; name: string };
  class: { id: number; name: string };
}

export interface ClassTeacherAssignment extends AssignmentRefs {
  id: number;
  staff_id: number;
  staff?: { id: number; name: string };
  section: { id: number; name: string } | null;
}

export interface SubjectTeacherAssignment extends AssignmentRefs {
  id: number;
  staff_id: number;
  staff?: { id: number; name: string };
  subject: { id: number; name: string; code: string };
}

export interface ClassTeacherAssignmentInput {
  academic_session_id: number;
  class_id: number;
  section_id: number | null;
}

export interface SubjectTeacherAssignmentInput {
  academic_session_id: number;
  class_id: number;
  subject_id: number;
}

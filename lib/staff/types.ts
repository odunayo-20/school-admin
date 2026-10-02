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

export type TeacherAssignmentStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export interface TeacherAssignment {
  id: number;
  teaching_staff_id?: number;
  teaching_staff?: {
    id: number;
    staff_number: string;
    name?: string | null;
    email?: string | null;
    staff_type?: StaffType;
    status?: string;
  };
  class_subject: {
    id: number;
    school_class: { id: number; name: string; code?: string };
    subject: { id: number; name: string; code: string };
    status: string;
  };
  academic_session: {
    id: number;
    name: string;
    status?: string;
    is_current?: boolean;
  };
  status: TeacherAssignmentStatus;
  notes: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at?: string;

  // Flattened shims for compatibility with existing consumers
  class: { id: number; name: string };
  subject: { id: number; name: string; code: string };
  staff?: { id: number; name: string };
  staff_id: number;
  section?: { id: number; name: string } | null;
}

export type ClassTeacherAssignment = TeacherAssignment;
export type SubjectTeacherAssignment = TeacherAssignment;

export interface TeacherAssignmentFilters {
  teaching_staff_id?: number;
  class_subject_id?: number;
  academic_session_id?: number;
  status?: TeacherAssignmentStatus;
  page?: number;
  per_page?: number;
}

export interface CreateTeacherAssignmentInput {
  teaching_staff_id: number;
  class_subject_id: number;
  academic_session_id: number;
  notes?: string | null;
}

export interface UpdateTeacherAssignmentInput {
  notes?: string | null;
}

export interface EndTeacherAssignmentInput {
  notes?: string | null;
}

export interface CancelTeacherAssignmentInput {
  notes?: string | null;
}

export interface ClassTeacherAssignmentInput {
  academic_session_id: number;
  class_id: number;
  section_id?: number | null;
}

export interface SubjectTeacherAssignmentInput {
  academic_session_id: number;
  class_id?: number;
  subject_id?: number;
  class_subject_id?: number;
  notes?: string | null;
}


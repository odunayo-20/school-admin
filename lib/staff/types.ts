import type { UserRole } from "@/lib/auth/types";

/**
 * PROPOSED CONTRACT for Module 04 (Staff Management). No Laravel backend
 * exists yet — built ahead per the project owner's direction, same as
 * Module 02. Key domain decisions (documented in the Module 04 report,
 * not re-derived here):
 *
 *  - Staff is its own record, distinct from User. `account` is nullable:
 *    a staff member does not necessarily have login access.
 *  - "Teacher" is not a separate model — `is_teacher` is a flag on Staff,
 *    and actual teaching work is tracked via two assignment types that
 *    reuse Module 02's sessions/classes/sections/subjects:
 *      - ClassTeacherAssignment (homeroom-style: session + class + section)
 *      - SubjectTeacherAssignment (session + class + subject)
 *  - No Department entity (Module 02 never established one) — staff carry
 *    a free-text `designation` instead.
 *  - No delete: only `status` (active/inactive) is mutable.
 */

export type StaffStatus = "active" | "inactive";
export type EmploymentType = "full_time" | "part_time" | "contract";

export interface StaffAccount {
  id: number;
  email: string;
  role: UserRole;
}

export interface Staff {
  id: number;
  staff_no: string;
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  employment_type: EmploymentType;
  date_joined: string | null;
  is_teacher: boolean;
  status: StaffStatus;
  account: StaffAccount | null;
  created_at: string;
}

export interface StaffListItem
  extends Pick<
    Staff,
    "id" | "staff_no" | "name" | "email" | "phone" | "designation" | "is_teacher" | "status"
  > {
  account: Pick<StaffAccount, "role"> | null;
}

export interface StaffFilters {
  search?: string;
  status?: StaffStatus;
  employment_type?: EmploymentType;
  is_teacher?: boolean;
  page?: number;
}

export interface StaffInput {
  name: string;
  email: string | null;
  phone: string | null;
  designation: string | null;
  employment_type: EmploymentType;
  date_joined: string | null;
  is_teacher: boolean;
}

export interface GrantAccountInput {
  email: string;
  role: UserRole;
}

interface AssignmentRefs {
  academic_session: { id: number; name: string };
  class: { id: number; name: string };
}

export interface ClassTeacherAssignment extends AssignmentRefs {
  id: number;
  staff_id: number;
  /** Only populated when fetched from a class-scoped endpoint (Module 05's
   * class academic view) — the staff-scoped endpoints Module 04 uses don't
   * need it since the staff identity is already known from context. */
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

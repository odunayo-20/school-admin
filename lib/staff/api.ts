import { apiClient } from "@/lib/api/client";
import { STAFF_ENDPOINTS as E } from "@/lib/staff/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  ClassTeacherAssignment,
  ClassTeacherAssignmentInput,
  GrantAccountInput,
  Staff,
  StaffFilters,
  StaffInput,
  StaffListItem,
  StaffStatus,
  SubjectTeacherAssignment,
  SubjectTeacherAssignmentInput,
} from "@/lib/staff/types";

function buildQuery(filters: StaffFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.employment_type) params.set("employment_type", filters.employment_type);
  if (filters.is_teacher !== undefined) params.set("is_teacher", String(filters.is_teacher));
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getStaffList = (filters: StaffFilters) =>
  apiClient.get<Paginated<StaffListItem>>(`${E.staff}?${buildQuery(filters)}`);

export const getStaffMember = (id: number) => apiClient.get<Staff>(E.staffMember(id));

export const createStaff = (data: StaffInput) => apiClient.post<Staff>(E.staff, { ...data });

export const updateStaff = (id: number, data: StaffInput) =>
  apiClient.put<Staff>(E.staffMember(id), { ...data });

export const updateStaffStatus = (id: number, status: StaffStatus) =>
  apiClient.post<Staff>(E.staffStatus(id), { status });

export const grantStaffAccount = (id: number, data: GrantAccountInput) =>
  apiClient.post<Staff>(E.staffAccount(id), { ...data });

// Class teacher assignments
export const getClassAssignments = (staffId: number) =>
  apiClient.get<ClassTeacherAssignment[]>(E.classAssignments(staffId));

export const createClassAssignment = (staffId: number, data: ClassTeacherAssignmentInput) =>
  apiClient.post<ClassTeacherAssignment>(E.createClassAssignment, { staff_id: staffId, ...data });

export const deleteClassAssignment = (id: number) =>
  apiClient.delete<void>(E.deleteClassAssignment(id));

// Subject teacher assignments
export const getSubjectAssignments = (staffId: number) =>
  apiClient.get<SubjectTeacherAssignment[]>(E.subjectAssignments(staffId));

export const createSubjectAssignment = (staffId: number, data: SubjectTeacherAssignmentInput) =>
  apiClient.post<SubjectTeacherAssignment>(E.createSubjectAssignment, {
    staff_id: staffId,
    ...data,
  });

export const deleteSubjectAssignment = (id: number) =>
  apiClient.delete<void>(E.deleteSubjectAssignment(id));

// Reverse (class-scoped) lookups — read-only, for the class academic view.
export const getClassTeachersForClass = (classId: number, academicSessionId: number) =>
  apiClient.get<ClassTeacherAssignment[]>(
    `${E.classTeachersForClass(classId)}?academic_session_id=${academicSessionId}`
  );

export const getSubjectTeachersForClass = (classId: number, academicSessionId: number) =>
  apiClient.get<SubjectTeacherAssignment[]>(
    `${E.subjectTeachersForClass(classId)}?academic_session_id=${academicSessionId}`
  );

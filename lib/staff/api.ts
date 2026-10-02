import { apiClient } from "@/lib/api/client";
import { STAFF_ENDPOINTS as E } from "@/lib/staff/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  ClassTeacherAssignment,
  ClassTeacherAssignmentInput,
  GrantAccountInput,
  Staff,
  StaffCreateInput,
  StaffFilters,
  StaffListItem,
  StaffUpdateInput,
  SubjectTeacherAssignment,
  SubjectTeacherAssignmentInput,
} from "@/lib/staff/types";

function buildQuery(filters: StaffFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.staff_type) params.set("staff_type", filters.staff_type);
  if (filters.page) params.set("page", String(filters.page));
  return params.toString();
}

export const getStaffList = (filters: StaffFilters) =>
  apiClient.get<Paginated<StaffListItem>>(`${E.staff}?${buildQuery(filters)}`);

export const getStaffMember = (id: number) => apiClient.get<Staff>(E.staffMember(id));

export const getMyStaffProfile = () => apiClient.get<Staff>(E.myProfile);

export const createStaff = (data: StaffCreateInput) =>
  apiClient.post<Staff>(E.staff, { ...data });

export const updateStaff = (id: number, data: StaffUpdateInput) =>
  apiClient.put<Staff>(E.staffMember(id), { ...data });

/** Activate a staff member (re-opens terminated is blocked by the service). */
export const activateStaff = (id: number) => apiClient.post<Staff>(E.activate(id), {});

/** Deactivate a staff member (sets status to INACTIVE, login is unchanged). */
export const deactivateStaff = (id: number) => apiClient.post<Staff>(E.deactivate(id), {});

export const grantStaffAccount = (id: number, data: GrantAccountInput) =>
  apiClient.post<Staff>(E.staffAccount(id), { ...data });

// Class teacher assignments
export const getClassAssignments = async (staffId: number): Promise<ClassTeacherAssignment[]> => {
  const res = await apiClient.get<any>(E.classAssignments(staffId));
  return Array.isArray(res) ? res : (res?.data ?? []);
};

export const createClassAssignment = (staffId: number, data: ClassTeacherAssignmentInput) =>
  apiClient.post<ClassTeacherAssignment>(E.createClassAssignment, { staff_id: staffId, ...data });

export const deleteClassAssignment = (id: number) =>
  apiClient.delete<void>(E.deleteClassAssignment(id));

// Subject teacher assignments
export const getSubjectAssignments = async (staffId: number): Promise<SubjectTeacherAssignment[]> => {
  const res = await apiClient.get<any>(E.subjectAssignments(staffId));
  return Array.isArray(res) ? res : (res?.data ?? []);
};

export const createSubjectAssignment = (staffId: number, data: SubjectTeacherAssignmentInput) =>
  apiClient.post<SubjectTeacherAssignment>(E.createSubjectAssignment, {
    staff_id: staffId,
    ...data,
  });

export const deleteSubjectAssignment = (id: number) =>
  apiClient.delete<void>(E.deleteSubjectAssignment(id));

// Reverse (class-scoped) lookups
export const getClassTeachersForClass = (classId: number, academicSessionId: number) =>
  apiClient.get<ClassTeacherAssignment[]>(
    `${E.classTeachersForClass(classId)}?academic_session_id=${academicSessionId}`
  );

export const getSubjectTeachersForClass = (classId: number, academicSessionId: number) =>
  apiClient.get<SubjectTeacherAssignment[]>(
    `${E.subjectTeachersForClass(classId)}?academic_session_id=${academicSessionId}`
  );

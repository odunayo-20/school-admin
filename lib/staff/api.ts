import { apiClient } from "@/lib/api/client";
import { STAFF_ENDPOINTS as E } from "@/lib/staff/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  CancelTeacherAssignmentInput,
  ClassTeacherAssignment,
  ClassTeacherAssignmentInput,
  CreateTeacherAssignmentInput,
  EndTeacherAssignmentInput,
  Staff,
  StaffCreateInput,
  StaffFilters,
  StaffListItem,
  StaffUpdateInput,
  SubjectTeacherAssignment,
  SubjectTeacherAssignmentInput,
  TeacherAssignment,
  TeacherAssignmentFilters,
  TeacherAssignmentStatus,
  UpdateTeacherAssignmentInput,
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

// ── Teacher Assignments (Module 08) ───────────────────────────────────


function normalizeTeacherAssignment(raw: any): TeacherAssignment {
  const schoolClass =
    raw.class_subject?.school_class ?? raw.class ?? { id: 0, name: "" };
  const subject =
    raw.class_subject?.subject ?? raw.subject ?? { id: 0, name: "", code: "" };
  const staff = raw.teaching_staff
    ? { id: raw.teaching_staff.id, name: raw.teaching_staff.name ?? "" }
    : raw.staff;

  return {
    ...raw,
    staff_id: raw.teaching_staff?.id ?? raw.staff_id ?? 0,
    staff,
    class: schoolClass,
    subject,
    section: null,
  };
}

export const getTeacherAssignments = async (
  filters: import("@/lib/staff/types").TeacherAssignmentFilters
): Promise<Paginated<TeacherAssignment>> => {
  const params = new URLSearchParams();
  if (filters.teaching_staff_id) params.set("teaching_staff_id", String(filters.teaching_staff_id));
  if (filters.class_subject_id) params.set("class_subject_id", String(filters.class_subject_id));
  if (filters.academic_session_id) params.set("academic_session_id", String(filters.academic_session_id));
  if (filters.status) params.set("status", filters.status);
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));

  const res = await apiClient.get<Paginated<any>>(`${E.teacherAssignments}?${params.toString()}`);
  return {
    ...res,
    data: (res?.data ?? []).map(normalizeTeacherAssignment),
  };
};

export const getTeacherAssignmentsForStaff = async (
  staffId: number,
  status?: import("@/lib/staff/types").TeacherAssignmentStatus
): Promise<TeacherAssignment[]> => {
  const params = new URLSearchParams({
    teaching_staff_id: String(staffId),
    per_page: "100",
  });
  if (status) params.set("status", status);

  const res = await apiClient.get<Paginated<any>>(`${E.teacherAssignments}?${params.toString()}`);
  const items = Array.isArray(res) ? res : (res?.data ?? []);
  return items.map(normalizeTeacherAssignment);
};

export const createTeacherAssignment = async (
  data: CreateTeacherAssignmentInput
): Promise<TeacherAssignment> => {
  const res = await apiClient.post<any>(E.teacherAssignments, { ...data });
  return normalizeTeacherAssignment(res?.data ?? res);
};

export const updateTeacherAssignment = async (
  id: number,
  data: UpdateTeacherAssignmentInput
): Promise<TeacherAssignment> => {
  const res = await apiClient.put<any>(E.teacherAssignment(id), { ...data });
  return normalizeTeacherAssignment(res?.data ?? res);
};

export const endTeacherAssignment = async (
  id: number,
  data?: EndTeacherAssignmentInput
): Promise<TeacherAssignment> => {
  const res = await apiClient.post<any>(E.endTeacherAssignment(id), { ...(data ?? {}) });
  return normalizeTeacherAssignment(res?.data ?? res);
};

export const cancelTeacherAssignment = async (
  id: number,
  data?: CancelTeacherAssignmentInput
): Promise<TeacherAssignment> => {
  const res = await apiClient.post<any>(E.cancelTeacherAssignment(id), { ...(data ?? {}) });
  return normalizeTeacherAssignment(res?.data ?? res);
};

// Legacy compatibility shims
export const getClassAssignments = async (_staffId: number): Promise<ClassTeacherAssignment[]> => {
  // Backend has no class teacher entity; return empty array safely
  return [];
};

export const createClassAssignment = async (
  _staffId: number,
  _data: ClassTeacherAssignmentInput
): Promise<ClassTeacherAssignment> => {
  throw new Error("Class teacher assignment is not part of the active academic curriculum schema.");
};


export const deleteClassAssignment = async (id: number) => {
  return cancelTeacherAssignment(id);
};

export const getSubjectAssignments = async (staffId: number): Promise<SubjectTeacherAssignment[]> => {
  return getTeacherAssignmentsForStaff(staffId, "ACTIVE");
};

export const createSubjectAssignment = async (
  staffId: number,
  data: SubjectTeacherAssignmentInput
) => {
  let classSubjectId = data.class_subject_id;
  if (!classSubjectId && data.class_id && data.subject_id) {
    const res = await apiClient.get<Paginated<{ id: number; status: string }>>(
      `/api/class-subjects?school_class_id=${data.class_id}&subject_id=${data.subject_id}&status=ACTIVE`
    );
    const item = res?.data?.[0];
    if (item) classSubjectId = item.id;
  }
  if (!classSubjectId) {
    throw new Error("Could not find class subject offering for this class and subject.");
  }
  return createTeacherAssignment({
    teaching_staff_id: staffId,
    class_subject_id: classSubjectId,
    academic_session_id: data.academic_session_id,
    notes: data.notes,
  });
};

export const deleteSubjectAssignment = async (id: number) => {
  return cancelTeacherAssignment(id);
};

export const getClassTeachersForClass = async (
  _classId: number,
  _academicSessionId: number
): Promise<ClassTeacherAssignment[]> => {
  return [];
};

export const getSubjectTeachersForClass = async (classId: number, academicSessionId: number) => {
  const params = new URLSearchParams({
    academic_session_id: String(academicSessionId),
    status: "ACTIVE",
    per_page: "100",
  });
  const res = await apiClient.get<Paginated<any>>(`${E.teacherAssignments}?${params.toString()}`);
  const items: any[] = Array.isArray(res) ? res : (res?.data ?? []);
  return items
    .filter((item) => (item.class_subject?.school_class?.id ?? item.class?.id) === classId)
    .map(normalizeTeacherAssignment);
};



import { apiClient } from "@/lib/api/client";
import { STUDENT_ENDPOINTS as E } from "@/lib/students/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  Guardian,
  GuardianInput,
  Student,
  StudentFilters,
  StudentListItem,
  StudentPersonalInput,
  StudentStatus,
} from "@/lib/students/types";

function buildQuery(filters: StudentFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  if (filters.class_id) params.set("class_id", String(filters.class_id));
  if (filters.section_id) params.set("section_id", String(filters.section_id));
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getStudentList = (filters: StudentFilters) =>
  apiClient.get<Paginated<StudentListItem>>(`${E.students}?${buildQuery(filters)}`);

export const getStudent = (id: number) => apiClient.get<Student>(E.student(id));

export const updateStudentPersonalInfo = (id: number, data: StudentPersonalInput) =>
  apiClient.put<Student>(E.student(id), { ...data });

export const updateStudentStatus = (id: number, status: StudentStatus) =>
  apiClient.post<Student>(E.status(id), { status });

// Guardians
export const createGuardian = (studentId: number, data: GuardianInput) =>
  apiClient.post<Guardian>(E.guardians(studentId), { ...data });

export const updateGuardian = (studentId: number, guardianId: number, data: GuardianInput) =>
  apiClient.put<Guardian>(E.guardian(studentId, guardianId), { ...data });

export const deleteGuardian = (studentId: number, guardianId: number) =>
  apiClient.delete<void>(E.guardian(studentId, guardianId));

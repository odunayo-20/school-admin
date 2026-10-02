import { apiClient } from "@/lib/api/client";
import { ENROLLMENT_ENDPOINTS as E } from "@/lib/enrollment/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  Enrollment,
  EnrollmentInput,
  EnrollmentStatus,
  RosterFilters,
  RosterStudent,
} from "@/lib/enrollment/types";

function buildQuery(filters: RosterFilters): string {
  const params = new URLSearchParams();
  params.set("academic_session_id", String(filters.academic_session_id));
  if (filters.section_id) params.set("section_id", String(filters.section_id));
  if (filters.search) params.set("search", filters.search);
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getClassRoster = (classId: number, filters: RosterFilters) =>
  apiClient.get<Paginated<RosterStudent>>(`${E.classRoster(classId)}&${buildQuery(filters)}`);

export const getStudentEnrollments = async (studentId: number): Promise<Enrollment[]> => {
  try {
    const res = await apiClient.get<Paginated<Enrollment>>(`${E.studentEnrollments(studentId)}&per_page=100`);
    if (Array.isArray(res)) return res;
    return res?.data ?? [];
  } catch {
    return [];
  }
};

export const createEnrollment = (data: EnrollmentInput) =>
  apiClient.post<Enrollment>(E.createEnrollment, {
    student_id: data.student_id,
    academic_session_id: data.academic_session_id,
    school_class_id: data.class_id,
    section_id: data.section_id,
    enrollment_date: new Date().toISOString().slice(0, 10),
  });

export const updateEnrollmentStatus = (id: number, status: EnrollmentStatus) => {
  if (status === "withdrawn") {
    return apiClient.post<Enrollment>(E.withdraw(id));
  }
  if (status === "cancelled") {
    return apiClient.post<Enrollment>(E.cancel(id));
  }
  return apiClient.put<Enrollment>(`/api/enrollments/${id}`, { status });
};

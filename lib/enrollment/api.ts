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
  apiClient.get<Paginated<RosterStudent>>(`${E.classRoster(classId)}?${buildQuery(filters)}`);

export const getStudentEnrollments = (studentId: number) =>
  apiClient.get<Enrollment[]>(E.studentEnrollments(studentId));

export const createEnrollment = (data: EnrollmentInput) =>
  apiClient.post<Enrollment>(E.createEnrollment, { ...data });

export const updateEnrollmentStatus = (id: number, status: EnrollmentStatus) =>
  apiClient.post<Enrollment>(E.enrollmentStatus(id), { status });

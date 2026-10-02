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

export const updateStudentPersonalInfo = (id: number, data: StudentPersonalInput) => {
  let firstName = data.first_name;
  let lastName = data.last_name;
  let middleName = data.middle_name;

  if (!firstName && data.name) {
    const parts = data.name.trim().split(" ");
    firstName = parts[0];
    if (parts.length > 2) {
      middleName = parts.slice(1, -1).join(" ");
      lastName = parts[parts.length - 1];
    } else if (parts.length === 2) {
      lastName = parts[1];
    }
  }

  return apiClient.put<Student>(E.student(id), {
    first_name: firstName || "Student",
    middle_name: middleName || null,
    last_name: lastName || null,
    date_of_birth: data.date_of_birth || null,
    gender: data.gender ? (data.gender.toUpperCase() as any) : null,
    ...(data.student_number ? { student_number: data.student_number } : {}),
  });
};

export const updateStudentStatus = async (
  id: number,
  status: StudentStatus,
  currentAttributes?: Partial<StudentPersonalInput>
) => {
  let attributes = currentAttributes;
  if (!attributes?.first_name && !attributes?.name) {
    const current = await getStudent(id);
    attributes = {
      first_name: current.first_name || (current.name ? current.name.split(" ")[0] : "Student"),
      middle_name: current.middle_name || null,
      last_name: current.last_name || (current.name ? current.name.split(" ").slice(1).join(" ") : null),
      date_of_birth: current.date_of_birth,
      gender: current.gender,
      student_number: current.student_number || current.student_no,
    };
  }

  return apiClient.put<Student>(E.student(id), {
    first_name: attributes.first_name || "Student",
    middle_name: attributes.middle_name || null,
    last_name: attributes.last_name || null,
    date_of_birth: attributes.date_of_birth || null,
    gender: attributes.gender ? (attributes.gender.toUpperCase() as any) : null,
    ...(attributes.student_number ? { student_number: attributes.student_number } : {}),
    status,
  });
};

// Guardians
export const createGuardian = (studentId: number, data: GuardianInput) =>
  apiClient.post<Guardian>(E.guardians(studentId), { ...data });

export const updateGuardian = (studentId: number, guardianId: number, data: GuardianInput) =>
  apiClient.put<Guardian>(E.guardian(studentId, guardianId), { ...data });

export const deleteGuardian = (studentId: number, guardianId: number) =>
  apiClient.delete<void>(E.guardian(studentId, guardianId));

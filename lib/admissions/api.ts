import { apiClient } from "@/lib/api/client";
import { ADMISSION_ENDPOINTS as E } from "@/lib/admissions/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type { Student } from "@/lib/students/types";
import type {
  Admission,
  AdmissionFilters,
  AdmissionInput,
  AdmissionListItem,
} from "@/lib/admissions/types";

function buildQuery(filters: AdmissionFilters): string {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status) params.set("status", filters.status);
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getAdmissionList = (filters: AdmissionFilters) =>
  apiClient.get<Paginated<AdmissionListItem>>(`${E.admissions}?${buildQuery(filters)}`);

export const getAdmission = (id: number) => apiClient.get<Admission>(E.admission(id));

export const createAdmission = (data: AdmissionInput) =>
  apiClient.post<Admission>(E.admissions, { ...data });

export const updateAdmission = (id: number, data: AdmissionInput) =>
  apiClient.put<Admission>(E.admission(id), { ...data });

export const approveAdmission = (id: number) =>
  apiClient.post<{ admission: Admission; student: Student }>(E.approve(id));

export const rejectAdmission = (id: number) => apiClient.post<Admission>(E.reject(id));

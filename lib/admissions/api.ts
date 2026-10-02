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

function normalizeStatusParam(status?: string): string | undefined {
  if (!status) return undefined;
  const upper = status.toUpperCase();
  if (upper === "APPROVED") return "ADMITTED";
  return upper;
}

function buildQuery(filters: AdmissionFilters): string {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  const normStatus = normalizeStatusParam(filters.status);
  if (normStatus) params.set("status", normStatus);
  if (filters.academic_session_id) params.set("academic_session_id", String(filters.academic_session_id));
  if (filters.entry_class_level_id) params.set("entry_class_level_id", String(filters.entry_class_level_id));
  params.set("page", String(filters.page ?? 1));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  return params.toString();
}

export function normalizeAdmission(raw: Admission): Admission {
  const fullName =
    raw.full_name ||
    [raw.first_name, raw.middle_name, raw.last_name].filter(Boolean).join(" ") ||
    raw.applicant_name ||
    "Applicant";

  const admissionNo = raw.admission_number || raw.admission_no || `ADM-${raw.id}`;
  const appDate = raw.created_at
    ? raw.created_at.slice(0, 10)
    : raw.application_date || "";

  const studentId = raw.student?.id ?? raw.student_id ?? null;
  const intendedClass = raw.entry_class_level
    ? { id: raw.entry_class_level.id, name: raw.entry_class_level.name }
    : raw.intended_class ?? null;

  return {
    ...raw,
    admission_number: admissionNo,
    admission_no: admissionNo,
    full_name: fullName,
    applicant_name: fullName,
    application_date: appDate,
    student_id: studentId,
    intended_class: intendedClass,
  };
}

export function prepareAdmissionPayload(data: AdmissionInput): Record<string, unknown> {
  let firstName = data.first_name?.trim();
  let lastName = data.last_name?.trim();

  // If first_name wasn't supplied directly, attempt to split applicant_name
  if (!firstName && data.applicant_name?.trim()) {
    const parts = data.applicant_name.trim().split(" ");
    firstName = parts[0];
    lastName = parts.slice(1).join(" ") || undefined;
  }

  const payload: Record<string, unknown> = {
    first_name: firstName,
    academic_session_id: Number(data.academic_session_id),
  };

  if (data.middle_name?.trim()) payload.middle_name = data.middle_name.trim();
  if (lastName) payload.last_name = lastName;
  if (data.date_of_birth) payload.date_of_birth = data.date_of_birth;
  if (data.gender) payload.gender = data.gender.toUpperCase();

  const entryLevelId = data.entry_class_level_id ?? data.intended_class_id;
  if (entryLevelId) payload.entry_class_level_id = Number(entryLevelId);

  if (data.admission_number?.trim()) payload.admission_number = data.admission_number.trim().toUpperCase();
  if (data.notes?.trim()) payload.notes = data.notes.trim();

  return payload;
}

export const getAdmissionList = async (
  filters: AdmissionFilters
): Promise<Paginated<AdmissionListItem>> => {
  const res = await apiClient.get<Paginated<AdmissionListItem>>(
    `${E.admissions}?${buildQuery(filters)}`
  );
  return {
    ...res,
    data: (res.data || []).map(normalizeAdmission),
  };
};

export const getAdmission = async (id: number): Promise<Admission> => {
  const res = await apiClient.get<Admission>(E.admission(id));
  return normalizeAdmission(res);
};

export const createAdmission = async (data: AdmissionInput): Promise<Admission> => {
  const payload = prepareAdmissionPayload(data);
  const res = await apiClient.post<Admission>(E.admissions, payload);
  return normalizeAdmission(res);
};

export const updateAdmission = async (
  id: number,
  data: AdmissionInput
): Promise<Admission> => {
  const payload = prepareAdmissionPayload(data);
  const res = await apiClient.put<Admission>(E.admission(id), payload);
  return normalizeAdmission(res);
};

export const admitAdmission = async (id: number): Promise<Admission> => {
  const res = await apiClient.post<Admission>(E.admit(id));
  return normalizeAdmission(res);
};

export const approveAdmission = async (
  id: number
): Promise<Admission & { admission: Admission; student: Student }> => {
  const admitted = await admitAdmission(id);
  return {
    ...admitted,
    admission: admitted,
    student: (admitted.student || {
      id: admitted.student_id ?? id,
      student_number: `STD-${String(admitted.id).padStart(4, "0")}`,
      first_name: admitted.first_name,
      last_name: admitted.last_name ?? "",
      status: "active" as any,
      gender: admitted.gender,
      date_of_birth: admitted.date_of_birth,
      created_at: admitted.created_at,
    }) as Student,
  };
};

export const rejectAdmission = async (
  id: number,
  notes?: string | null
): Promise<Admission> => {
  const body = notes?.trim() ? { notes: notes.trim() } : {};
  const res = await apiClient.post<Admission>(E.reject(id), body);
  return normalizeAdmission(res);
};

export const withdrawAdmission = async (
  id: number,
  notes?: string | null
): Promise<Admission> => {
  const body = notes?.trim() ? { notes: notes.trim() } : {};
  const res = await apiClient.post<Admission>(E.withdraw(id), body);
  return normalizeAdmission(res);
};

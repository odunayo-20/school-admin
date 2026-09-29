import { apiClient } from "@/lib/api/client";
import { PROMOTION_ENDPOINTS as E } from "@/lib/promotions/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  BulkPromotionInput,
  PromotionCandidate,
  PromotionCandidateFilters,
  PromotionHistoryFilters,
  PromotionRecord,
} from "@/lib/promotions/types";

function buildCandidateQuery(filters: PromotionCandidateFilters): string {
  const params = new URLSearchParams();
  params.set("academic_session_id", String(filters.academic_session_id));
  params.set("class_id", String(filters.class_id));
  if (filters.section_id) params.set("section_id", String(filters.section_id));
  return params.toString();
}

function buildHistoryQuery(filters: PromotionHistoryFilters): string {
  const params = new URLSearchParams();
  if (filters.student_id) params.set("student_id", String(filters.student_id));
  if (filters.academic_session_id) params.set("academic_session_id", String(filters.academic_session_id));
  if (filters.class_id) params.set("class_id", String(filters.class_id));
  if (filters.decision) params.set("decision", filters.decision);
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getPromotionCandidates = (filters: PromotionCandidateFilters) =>
  apiClient.get<PromotionCandidate[]>(`${E.candidates}?${buildCandidateQuery(filters)}`);

export const executeBulkPromotion = (data: BulkPromotionInput) =>
  apiClient.post<PromotionRecord[]>(E.bulk, { ...data });

export const getPromotionHistory = (filters: PromotionHistoryFilters) =>
  apiClient.get<Paginated<PromotionRecord>>(`${E.history}?${buildHistoryQuery(filters)}`);

export const getStudentPromotions = (studentId: number) =>
  apiClient.get<PromotionRecord[]>(E.studentHistory(studentId));

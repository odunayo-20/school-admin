import { apiClient } from "@/lib/api/client";
import { RESULT_ENDPOINTS as E } from "@/lib/results/endpoints";
import type { Paginated } from "@/lib/academics/types";
import type {
  CreateResultBatchInput,
  ResultBatch,
  ResultBatchDetail,
  ResultBatchFilters,
  ResultEntryInput,
  StudentResult,
} from "@/lib/results/types";

function buildQuery(filters: ResultBatchFilters): string {
  const params = new URLSearchParams();
  if (filters.academic_session_id) params.set("academic_session_id", String(filters.academic_session_id));
  if (filters.term_id) params.set("term_id", String(filters.term_id));
  if (filters.class_id) params.set("class_id", String(filters.class_id));
  if (filters.section_id) params.set("section_id", String(filters.section_id));
  if (filters.subject_id) params.set("subject_id", String(filters.subject_id));
  if (filters.status) params.set("status", filters.status);
  if (filters.mine) params.set("mine", "true");
  params.set("page", String(filters.page ?? 1));
  return params.toString();
}

export const getResultBatches = (filters: ResultBatchFilters) =>
  apiClient.get<Paginated<ResultBatch>>(`${E.batches}?${buildQuery(filters)}`);

export const getResultBatch = (id: number) => apiClient.get<ResultBatchDetail>(E.batch(id));

export const createResultBatch = (data: CreateResultBatchInput) =>
  apiClient.post<ResultBatchDetail>(E.batches, { ...data });

export const saveResultEntries = (id: number, entries: ResultEntryInput[]) =>
  apiClient.put<ResultBatchDetail>(E.entries(id), { entries });

export const submitResultBatch = (id: number) => apiClient.post<ResultBatch>(E.submit(id));

export const approveResultBatch = (id: number) => apiClient.post<ResultBatch>(E.approve(id));

export const returnResultBatch = (id: number, reason: string) =>
  apiClient.post<ResultBatch>(E.return(id), { reason });

export const publishResultBatch = (id: number) => apiClient.post<ResultBatch>(E.publish(id));

export const getStudentResults = (studentId: number) =>
  apiClient.get<StudentResult[]>(E.studentResults(studentId));

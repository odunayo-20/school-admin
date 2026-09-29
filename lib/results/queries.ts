"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/results/api";
import type { CreateResultBatchInput, ResultBatchFilters, ResultEntryInput } from "@/lib/results/types";

const keys = {
  list: (filters: ResultBatchFilters) => ["result-batches", "list", filters] as const,
  detail: (id: number) => ["result-batches", "detail", id] as const,
  studentResults: (studentId: number) => ["students", studentId, "results"] as const,
};

export const useResultBatches = (filters: ResultBatchFilters) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => api.getResultBatches(filters) });

export const useResultBatch = (id: number) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => api.getResultBatch(id), enabled: id > 0 });

export function useCreateResultBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateResultBatchInput) => api.createResultBatch(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["result-batches", "list"] }),
  });
}

export function useSaveResultEntries(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: ResultEntryInput[]) => api.saveResultEntries(id, entries),
    onSuccess: (batch) => queryClient.setQueryData(keys.detail(id), batch),
  });
}

function useBatchTransition(mutationFn: (id: number) => Promise<unknown>, id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => mutationFn(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["result-batches", "list"] });
    },
  });
}

export const useSubmitResultBatch = (id: number) => useBatchTransition(api.submitResultBatch, id);
export const useApproveResultBatch = (id: number) => useBatchTransition(api.approveResultBatch, id);
export const usePublishResultBatch = (id: number) => useBatchTransition(api.publishResultBatch, id);

export function useReturnResultBatch(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => api.returnResultBatch(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["result-batches", "list"] });
    },
  });
}

export const useStudentResults = (studentId: number) =>
  useQuery({
    queryKey: keys.studentResults(studentId),
    queryFn: () => api.getStudentResults(studentId),
    enabled: studentId > 0,
  });

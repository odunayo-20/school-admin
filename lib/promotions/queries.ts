"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/promotions/api";
import type {
  BulkPromotionInput,
  PromotionCandidateFilters,
  PromotionHistoryFilters,
} from "@/lib/promotions/types";

const keys = {
  candidates: (filters: PromotionCandidateFilters) => ["promotions", "candidates", filters] as const,
  history: (filters: PromotionHistoryFilters) => ["promotions", "history", filters] as const,
  studentHistory: (studentId: number) => ["students", studentId, "promotions"] as const,
};

export const usePromotionCandidates = (filters: PromotionCandidateFilters) =>
  useQuery({
    queryKey: keys.candidates(filters),
    queryFn: () => api.getPromotionCandidates(filters),
    enabled: filters.academic_session_id > 0 && filters.class_id > 0,
  });

export function useExecuteBulkPromotion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BulkPromotionInput) => api.executeBulkPromotion(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promotions"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export const usePromotionHistory = (filters: PromotionHistoryFilters) =>
  useQuery({ queryKey: keys.history(filters), queryFn: () => api.getPromotionHistory(filters) });

export const useStudentPromotions = (studentId: number) =>
  useQuery({
    queryKey: keys.studentHistory(studentId),
    queryFn: () => api.getStudentPromotions(studentId),
    enabled: studentId > 0,
  });

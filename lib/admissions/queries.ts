"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/admissions/api";
import type { AdmissionFilters, AdmissionInput } from "@/lib/admissions/types";

const keys = {
  list: (filters: AdmissionFilters) => ["admissions", "list", filters] as const,
  detail: (id: number) => ["admissions", "detail", id] as const,
};

export const useAdmissionList = (filters: AdmissionFilters) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => api.getAdmissionList(filters) });

export const useAdmission = (id: number) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => api.getAdmission(id), enabled: id > 0 });

export function useCreateAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionInput) => api.createAdmission(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admissions", "list"] }),
  });
}

export function useUpdateAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionInput) => api.updateAdmission(id, data),
    onSuccess: (admission) => {
      queryClient.setQueryData(keys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: ["admissions", "list"] });
    },
  });
}

export function useApproveAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.approveAdmission(id),
    onSuccess: ({ admission }) => {
      queryClient.setQueryData(keys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: ["admissions", "list"] });
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
}

export function useRejectAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.rejectAdmission(id),
    onSuccess: (admission) => {
      queryClient.setQueryData(keys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: ["admissions", "list"] });
    },
  });
}

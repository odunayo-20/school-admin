"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/admissions/api";
import type { AdmissionFilters, AdmissionInput } from "@/lib/admissions/types";

export const admissionKeys = {
  all: ["admissions"] as const,
  lists: () => [...admissionKeys.all, "list"] as const,
  list: (filters: AdmissionFilters) => [...admissionKeys.lists(), filters] as const,
  details: () => [...admissionKeys.all, "detail"] as const,
  detail: (id: number) => [...admissionKeys.details(), id] as const,
};

export const useAdmissionList = (filters: AdmissionFilters) =>
  useQuery({
    queryKey: admissionKeys.list(filters),
    queryFn: () => api.getAdmissionList(filters),
  });

export const useAdmission = (id: number) =>
  useQuery({
    queryKey: admissionKeys.detail(id),
    queryFn: () => api.getAdmission(id),
    enabled: id > 0,
  });

export function useCreateAdmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionInput) => api.createAdmission(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
    },
  });
}

export function useUpdateAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AdmissionInput) => api.updateAdmission(id, data),
    onSuccess: (admission) => {
      queryClient.setQueryData(admissionKeys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
    },
  });
}

export function useAdmitAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.admitAdmission(id),
    onSuccess: (admission) => {
      queryClient.setQueryData(admissionKeys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useApproveAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.approveAdmission(id),
    onSuccess: ({ admission }) => {
      queryClient.setQueryData(admissionKeys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useRejectAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string | null) => api.rejectAdmission(id, notes),
    onSuccess: (admission) => {
      queryClient.setQueryData(admissionKeys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
    },
  });
}

export function useWithdrawAdmission(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notes?: string | null) => api.withdrawAdmission(id, notes),
    onSuccess: (admission) => {
      queryClient.setQueryData(admissionKeys.detail(id), admission);
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
    },
  });
}

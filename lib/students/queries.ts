"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/students/api";
import type {
  GuardianInput,
  StudentFilters,
  StudentPersonalInput,
  StudentStatus,
} from "@/lib/students/types";

const keys = {
  list: (filters: StudentFilters) => ["students", "list", filters] as const,
  detail: (id: number) => ["students", "detail", id] as const,
};

export const useStudentList = (filters: StudentFilters) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => api.getStudentList(filters) });

export const useStudent = (id: number) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => api.getStudent(id), enabled: id > 0 });

export function useUpdateStudentPersonalInfo(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StudentPersonalInput) => api.updateStudentPersonalInfo(id, data),
    onSuccess: (student) => {
      queryClient.setQueryData(keys.detail(id), student);
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
}

export function useUpdateStudentStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: StudentStatus) => api.updateStudentStatus(id, status),
    onSuccess: (student) => {
      queryClient.setQueryData(keys.detail(id), student);
      queryClient.invalidateQueries({ queryKey: ["students", "list"] });
    },
  });
}

export function useCreateGuardian(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GuardianInput) => api.createGuardian(studentId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.detail(studentId) }),
  });
}

export function useUpdateGuardian(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: GuardianInput }) =>
      api.updateGuardian(studentId, id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.detail(studentId) }),
  });
}

export function useDeleteGuardian(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (guardianId: number) => api.deleteGuardian(studentId, guardianId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.detail(studentId) }),
  });
}

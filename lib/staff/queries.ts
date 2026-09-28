"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/staff/api";
import type {
  ClassTeacherAssignmentInput,
  GrantAccountInput,
  StaffFilters,
  StaffInput,
  StaffStatus,
  SubjectTeacherAssignmentInput,
} from "@/lib/staff/types";

const keys = {
  list: (filters: StaffFilters) => ["staff", "list", filters] as const,
  detail: (id: number) => ["staff", "detail", id] as const,
  classAssignments: (staffId: number) => ["staff", staffId, "class-assignments"] as const,
  subjectAssignments: (staffId: number) => ["staff", staffId, "subject-assignments"] as const,
};

export const useStaffList = (filters: StaffFilters) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => api.getStaffList(filters) });

export const useStaffMember = (id: number) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => api.getStaffMember(id), enabled: id > 0 });

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffInput) => api.createStaff(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", "list"] }),
  });
}

export function useUpdateStaff(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffInput) => api.updateStaff(id, data),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

export function useUpdateStaffStatus(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: StaffStatus) => api.updateStaffStatus(id, status),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

export function useGrantStaffAccount(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GrantAccountInput) => api.grantStaffAccount(id, data),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

// Class teacher assignments
export const useClassAssignments = (staffId: number) =>
  useQuery({
    queryKey: keys.classAssignments(staffId),
    queryFn: () => api.getClassAssignments(staffId),
    enabled: staffId > 0,
  });

export function useCreateClassAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClassTeacherAssignmentInput) => api.createClassAssignment(staffId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.classAssignments(staffId) }),
  });
}

export function useDeleteClassAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClassAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.classAssignments(staffId) }),
  });
}

// Subject teacher assignments
export const useSubjectAssignments = (staffId: number) =>
  useQuery({
    queryKey: keys.subjectAssignments(staffId),
    queryFn: () => api.getSubjectAssignments(staffId),
    enabled: staffId > 0,
  });

export function useCreateSubjectAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SubjectTeacherAssignmentInput) => api.createSubjectAssignment(staffId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) }),
  });
}

export function useDeleteSubjectAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSubjectAssignment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) }),
  });
}

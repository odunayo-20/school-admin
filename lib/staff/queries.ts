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
  classTeachersForClass: (classId: number, sessionId: number) =>
    ["classes", classId, "class-teacher-assignments", sessionId] as const,
  subjectTeachersForClass: (classId: number, sessionId: number) =>
    ["classes", classId, "subject-teacher-assignments", sessionId] as const,
};

export const useStaffList = (filters: StaffFilters) =>
  useQuery({ queryKey: keys.list(filters), queryFn: () => api.getStaffList(filters) });

export const useStaffMember = (id: number) =>
  useQuery({ queryKey: keys.detail(id), queryFn: () => api.getStaffMember(id), enabled: id > 0 });

/** 404 is an expected, normal outcome here (not every account is linked to
 * a staff record) — don't retry it like a real failure. */
export const useMyStaffProfile = () =>
  useQuery({ queryKey: ["staff", "me"], queryFn: api.getMyStaffProfile, retry: false });

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
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: keys.classAssignments(staffId) });
      // The class academic view (Module 05) reads the same assignments the
      // other way round — keep it from going stale too, without touching
      // unrelated class-config queries.
      queryClient.invalidateQueries({
        queryKey: keys.classTeachersForClass(assignment.class.id, assignment.academic_session.id),
      });
    },
  });
}

export function useDeleteClassAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: { id: number; classId: number; academicSessionId: number }) =>
      api.deleteClassAssignment(assignment.id),
    onSuccess: (_void, assignment) => {
      queryClient.invalidateQueries({ queryKey: keys.classAssignments(staffId) });
      queryClient.invalidateQueries({
        queryKey: keys.classTeachersForClass(assignment.classId, assignment.academicSessionId),
      });
    },
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
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      queryClient.invalidateQueries({
        queryKey: keys.subjectTeachersForClass(assignment.class.id, assignment.academic_session.id),
      });
    },
  });
}

export function useDeleteSubjectAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: { id: number; classId: number; academicSessionId: number }) =>
      api.deleteSubjectAssignment(assignment.id),
    onSuccess: (_void, assignment) => {
      queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      queryClient.invalidateQueries({
        queryKey: keys.subjectTeachersForClass(assignment.classId, assignment.academicSessionId),
      });
    },
  });
}

// Reverse (class-scoped) lookups — read-only, for the class academic view.
export const useClassTeachersForClass = (classId: number, academicSessionId: number) =>
  useQuery({
    queryKey: keys.classTeachersForClass(classId, academicSessionId),
    queryFn: () => api.getClassTeachersForClass(classId, academicSessionId),
    enabled: classId > 0 && academicSessionId > 0,
  });

export const useSubjectTeachersForClass = (classId: number, academicSessionId: number) =>
  useQuery({
    queryKey: keys.subjectTeachersForClass(classId, academicSessionId),
    queryFn: () => api.getSubjectTeachersForClass(classId, academicSessionId),
    enabled: classId > 0 && academicSessionId > 0,
  });

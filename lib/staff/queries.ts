"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/staff/api";
import type {
  ClassTeacherAssignmentInput,
  StaffCreateInput,
  StaffFilters,
  StaffUpdateInput,
  SubjectTeacherAssignmentInput,
} from "@/lib/staff/types";

const keys = {
  list: (filters: StaffFilters) => ["staff", "list", filters] as const,
  detail: (id: number) => ["staff", "detail", id] as const,
  teacherAssignments: (filters: any) => ["teacher-assignments", filters] as const,
  staffTeacherAssignments: (staffId: number, status?: string) =>
    ["staff", staffId, "teacher-assignments", status] as const,
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

export const useMyStaffProfile = () =>
  useQuery({ queryKey: ["staff", "me"], queryFn: api.getMyStaffProfile, retry: false });

export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffCreateInput) => api.createStaff(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff", "list"] }),
  });
}

export function useUpdateStaff(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: StaffUpdateInput) => api.updateStaff(id, data),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

export function useActivateStaff(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.activateStaff(id),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

export function useDeactivateStaff(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.deactivateStaff(id),
    onSuccess: (staff) => {
      queryClient.setQueryData(keys.detail(id), staff);
      queryClient.invalidateQueries({ queryKey: ["staff", "list"] });
    },
  });
}

/** @deprecated Use useActivateStaff / useDeactivateStaff */
export function useUpdateStaffStatus(id: number) {
  const activate = useActivateStaff(id);
  const deactivate = useDeactivateStaff(id);
  return {
    mutate: (status: string) => {
      if (status === "ACTIVE" || status === "active") activate.mutate();
      else deactivate.mutate();
    },
    mutateAsync: async (status: string) => {
      if (status === "ACTIVE" || status === "active") return activate.mutateAsync();
      return deactivate.mutateAsync();
    },
    isPending: activate.isPending || deactivate.isPending,
  };
}

// ── Teacher Assignments (Module 08) ───────────────────────────────────


export const useTeacherAssignments = (filters: import("@/lib/staff/types").TeacherAssignmentFilters) =>
  useQuery({
    queryKey: keys.teacherAssignments(filters),
    queryFn: () => api.getTeacherAssignments(filters),
  });

export const useStaffTeacherAssignments = (
  staffId: number,
  status?: import("@/lib/staff/types").TeacherAssignmentStatus
) =>
  useQuery({
    queryKey: keys.staffTeacherAssignments(staffId, status),
    queryFn: () => api.getTeacherAssignmentsForStaff(staffId, status),
    enabled: staffId > 0,
  });

export function useCreateTeacherAssignment(staffId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: import("@/lib/staff/types").CreateTeacherAssignmentInput) =>
      api.createTeacherAssignment(data),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (staffId) {
        queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
        queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      }
      queryClient.invalidateQueries({
        queryKey: keys.subjectTeachersForClass(assignment.class.id, assignment.academic_session.id),
      });
    },
  });
}

export function useUpdateTeacherAssignment(staffId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: import("@/lib/staff/types").UpdateTeacherAssignmentInput;
    }) => api.updateTeacherAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (staffId) {
        queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
        queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      }
    },
  });
}

export function useEndTeacherAssignment(staffId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data?: import("@/lib/staff/types").EndTeacherAssignmentInput;
    }) => api.endTeacherAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (staffId) {
        queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
        queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      }
    },
  });
}

export function useCancelTeacherAssignment(staffId?: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data?: import("@/lib/staff/types").CancelTeacherAssignmentInput;
    }) => api.cancelTeacherAssignment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (staffId) {
        queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
        queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      }
    },
  });
}

// Class teacher assignments (legacy shims)
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

// Subject teacher assignments (mapped to real teacher assignments)
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
      queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      queryClient.invalidateQueries({
        queryKey: keys.subjectTeachersForClass(assignment.class.id, assignment.academic_session.id),
      });
    },
  });
}

export function useDeleteSubjectAssignment(staffId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (assignment: { id: number; classId?: number; academicSessionId?: number }) =>
      api.deleteSubjectAssignment(assignment.id),
    onSuccess: (_void, assignment) => {
      queryClient.invalidateQueries({ queryKey: keys.subjectAssignments(staffId) });
      queryClient.invalidateQueries({ queryKey: ["staff", staffId, "teacher-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-assignments"] });
      if (assignment.classId && assignment.academicSessionId) {
        queryClient.invalidateQueries({
          queryKey: keys.subjectTeachersForClass(assignment.classId, assignment.academicSessionId),
        });
      }
    },
  });
}

// Reverse (class-scoped) lookups
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


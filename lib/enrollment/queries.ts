"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/enrollment/api";
import type { EnrollmentInput, EnrollmentStatus, RosterFilters } from "@/lib/enrollment/types";

export const useClassRoster = (classId: number, filters: RosterFilters) =>
  useQuery({
    queryKey: ["classes", classId, "roster", filters],
    queryFn: () => api.getClassRoster(classId, filters),
    enabled: classId > 0 && filters.academic_session_id > 0,
  });

export const useStudentEnrollments = (studentId: number) =>
  useQuery({
    queryKey: ["students", studentId, "enrollments"],
    queryFn: () => api.getStudentEnrollments(studentId),
    enabled: studentId > 0,
  });

export function useCreateEnrollment(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EnrollmentInput) => api.createEnrollment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
    },
  });
}

export function useUpdateEnrollmentStatus(studentId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: EnrollmentStatus }) =>
      api.updateEnrollmentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students", studentId, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["students", "detail", studentId] });
    },
  });
}

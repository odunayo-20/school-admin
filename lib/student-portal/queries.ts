"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import * as api from "@/lib/student-portal/api";
import { useStudentAuth } from "@/lib/student-portal/auth-context";

const keys = {
  enrollment: ["student-portal", "enrollment", "me"] as const,
  reportCardHistory: (studentId: number, page: number) =>
    ["student-portal", "report-cards", studentId, page] as const,
  reportCard: (enrollmentId: number, termId: number) =>
    ["student-portal", "report-card", enrollmentId, termId] as const,
};

/** Enabled only once authenticated — never fetched before a token exists. */
export const useCurrentEnrollment = () => {
  const { isAuthenticated } = useStudentAuth();
  return useQuery({
    queryKey: keys.enrollment,
    queryFn: api.getCurrentEnrollment,
    enabled: isAuthenticated,
  });
};

export const useReportCardHistory = (page: number) => {
  const { isAuthenticated, user } = useStudentAuth();
  const studentId = user?.student?.id ?? 0;
  return useQuery({
    queryKey: keys.reportCardHistory(studentId, page),
    queryFn: () => api.getReportCardHistory(studentId, page),
    enabled: isAuthenticated && studentId > 0,
  });
};

export const useReportCard = (enrollmentId: number, termId: number) => {
  const { isAuthenticated } = useStudentAuth();
  return useQuery({
    queryKey: keys.reportCard(enrollmentId, termId),
    queryFn: () => api.getReportCard(enrollmentId, termId),
    enabled: isAuthenticated && enrollmentId > 0 && termId > 0,
  });
};

export const useRequestPasswordReset = () =>
  useMutation({ mutationFn: (email: string) => api.requestPasswordReset(email) });

export const useResetPassword = () =>
  useMutation({ mutationFn: api.resetPassword });

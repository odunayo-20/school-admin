"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/staff-portal/api";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";

const keys = {
  myAssignments: (status: string | undefined, page: number, perPage: number) =>
    ["staff-portal", "assignments", "me", status ?? "all", page, perPage] as const,
  academicSessions: ["staff-portal", "academic-sessions"] as const,
  terms: (academicSessionId: number) => ["staff-portal", "terms", academicSessionId] as const,
  assessments: (classSubjectId: number, termId: number) => ["staff-portal", "assessments", classSubjectId, termId] as const,
  scores: (assessmentId: number) => ["staff-portal", "scores", "assessment", assessmentId] as const,
  results: (classSubjectId: number, termId: number) => ["staff-portal", "results", classSubjectId, termId] as const,
};

export const useMyAssignments = (status: string | undefined, page: number, perPage = 15) => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.myAssignments(status, page, perPage),
    queryFn: () => api.getMyAssignments({ status, page, per_page: perPage }),
    enabled: isAuthenticated,
  });
};

export const useAcademicSessions = () => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.academicSessions,
    queryFn: api.getAcademicSessions,
    enabled: isAuthenticated,
  });
};

export const useTerms = (academicSessionId: number) => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.terms(academicSessionId),
    queryFn: () => api.getTerms(academicSessionId),
    enabled: isAuthenticated && academicSessionId > 0,
  });
};

export const useAssessments = (classSubjectId: number, termId: number) => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.assessments(classSubjectId, termId),
    queryFn: () => api.getAssessments({ class_subject_id: classSubjectId, term_id: termId }),
    enabled: isAuthenticated && classSubjectId > 0 && termId > 0,
  });
};

export const useScores = (assessmentId: number) => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.scores(assessmentId),
    queryFn: () => api.getScores({ assessment_id: assessmentId }),
    enabled: isAuthenticated && assessmentId > 0,
  });
};

export const useResults = (classSubjectId: number, termId: number) => {
  const { isAuthenticated } = useStaffAuth();
  return useQuery({
    queryKey: keys.results(classSubjectId, termId),
    queryFn: () => api.getResults({ class_subject_id: classSubjectId, term_id: termId }),
    enabled: isAuthenticated && classSubjectId > 0 && termId > 0,
  });
};

export const useCreateScore = (assessmentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createScore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.scores(assessmentId) });
    },
  });
};

export const useUpdateScore = (assessmentId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: { score: number; remarks?: string | null } }) =>
      api.updateScore(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.scores(assessmentId) });
    },
  });
};

export const useCompileClassResults = (classSubjectId: number, termId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.compileClassResults({ class_subject_id: classSubjectId, term_id: termId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.results(classSubjectId, termId) });
    },
  });
};

export const useSubmitResult = (classSubjectId: number, termId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.submitResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.results(classSubjectId, termId) });
    },
  });
};

export const useRequestPasswordReset = () =>
  useMutation({ mutationFn: (email: string) => api.requestPasswordReset(email) });

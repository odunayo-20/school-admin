"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/academics/api";
import type {
  AcademicSession,
  GradingScale,
  School,
  SchoolClass,
  Section,
  Subject,
  Term,
} from "@/lib/academics/types";

const keys = {
  school: ["school"] as const,
  sessions: (page: number) => ["academic-sessions", page] as const,
  terms: (sessionId: number) => ["terms", sessionId] as const,
  classLevels: (page: number) => ["class-levels", page] as const,
  classes: (page: number) => ["classes", page] as const,
  classDetail: (id: number) => ["classes", "detail", id] as const,
  subjects: (page: number) => ["subjects", page] as const,
  gradingScales: ["grading-scales"] as const,
};

// School & Academic Context
export const useSchool = () => useQuery({ queryKey: keys.school, queryFn: api.getSchool });
export const useAcademicContext = () =>
  useQuery({ queryKey: ["academic-context"], queryFn: api.getAcademicContext });

export function useUpdateSchool() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<School, "id">) => api.updateSchool(data),
    onSuccess: (school) => queryClient.setQueryData(keys.school, school),
  });
}

// Academic Sessions
export const useAcademicSessions = (page: number) =>
  useQuery({ queryKey: keys.sessions(page), queryFn: () => api.getAcademicSessions(page) });

export function useCreateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<AcademicSession, "name" | "start_date" | "end_date">) =>
      api.createAcademicSession(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });
}

export function useUpdateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Pick<AcademicSession, "name" | "start_date" | "end_date">;
    }) => api.updateAcademicSession(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });
}

export function useActivateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.activateAcademicSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["academic-sessions"] }),
  });
}

// Terms
export const useTerms = (sessionId: number) =>
  useQuery({
    queryKey: keys.terms(sessionId),
    queryFn: () => api.getTerms(sessionId),
    enabled: sessionId > 0,
  });

export function useCreateTerm(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<Term, "name" | "start_date" | "end_date">) =>
      api.createTerm(sessionId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) }),
  });
}

export function useUpdateTerm(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Pick<Term, "name" | "start_date" | "end_date"> }) =>
      api.updateTerm(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) }),
  });
}

// Class Levels
export const useClassLevels = (page = 1) =>
  useQuery({ queryKey: keys.classLevels(page), queryFn: () => api.getClassLevels(page) });

// Classes
export const useClasses = (page: number) =>
  useQuery({ queryKey: keys.classes(page), queryFn: () => api.getClasses(page) });

export const useClassDetail = (id: number) =>
  useQuery({ queryKey: keys.classDetail(id), queryFn: () => api.getClass(id), enabled: id > 0 });

export function useCreateClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createClass>[0]) => api.createClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-levels"] });
    },
  });
}

export function useUpdateClass(id: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.updateClass>[1]) => api.updateClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: keys.classDetail(id) });
    },
  });
}

// Sections
export function useCreateSection(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof api.createSection>[1]) => api.createSection(classId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useUpdateSection(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof api.updateSection>[1] }) =>
      api.updateSection(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

export function useDeleteSection(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

// Subjects
export const useSubjects = (page: number) =>
  useQuery({ queryKey: keys.subjects(page), queryFn: () => api.getSubjects(page) });

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Pick<Subject, "name" | "code">) => api.createSubject(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Pick<Subject, "name" | "code"> }) =>
      api.updateSubject(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSubject(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["subjects"] }),
  });
}

// Class <-> Subject assignment
export function useAssignSubjectToClass(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: number) => api.assignSubjectToClass(classId, subjectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) }),
  });
}

export function useUnassignSubjectFromClass(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: number) => api.unassignSubjectFromClass(classId, subjectId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) }),
  });
}

// Grading configuration
export const useGradingScales = () =>
  useQuery({ queryKey: keys.gradingScales, queryFn: api.getGradingScales });

export function useCreateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GradingScale, "id">) => api.createGradingScale(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.gradingScales }),
  });
}

export function useUpdateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Omit<GradingScale, "id"> }) =>
      api.updateGradingScale(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.gradingScales }),
  });
}

export function useDeleteGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteGradingScale(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.gradingScales }),
  });
}

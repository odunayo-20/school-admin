"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/academics/api";
import type {
  AcademicSessionFilters,
  ClassFilters,
  CreateAcademicSessionInput,
  CreateGradingScaleInput,
  CreateTermInput,
  GradingScale,
  GradingScaleFilters,
  School,
  SubjectFilters,
  CreateSubjectInput,
  UpdateSubjectInput,
  ClassSubjectFilters,
  CreateClassSubjectInput,
  UpdateAcademicSessionInput,
  UpdateGradingScaleInput,
  UpdateTermInput,
} from "@/lib/academics/types";


const keys = {
  school: ["school"] as const,
  sessions: (pageOrFilters?: number | AcademicSessionFilters) =>
    ["academic-sessions", pageOrFilters] as const,
  terms: (sessionId: number) => ["terms", sessionId] as const,
  classLevels: (page: number) => ["class-levels", page] as const,
  classes: (pageOrFilters?: number | ClassFilters) => ["classes", pageOrFilters] as const,
  classDetail: (id: number) => ["classes", "detail", id] as const,
  subjects: (pageOrFilters?: number | SubjectFilters) =>
    ["subjects", pageOrFilters] as const,
  subjectDetail: (id: number) => ["subjects", "detail", id] as const,
  classSubjects: (filters?: ClassSubjectFilters) =>
    ["class-subjects", filters] as const,
  classSubjectDetail: (id: number) => ["class-subjects", "detail", id] as const,
  gradingScales: (filters?: GradingScaleFilters) => ["grading-scales", filters] as const,
  gradingScaleDetail: (id: number) => ["grading-scales", "detail", id] as const,
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
export const useAcademicSessions = (pageOrFilters: number | AcademicSessionFilters = 1) =>
  useQuery({
    queryKey: keys.sessions(pageOrFilters),
    queryFn: () => api.getAcademicSessions(pageOrFilters),
  });

export function useCreateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAcademicSessionInput) =>
      api.createAcademicSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
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
      data: UpdateAcademicSessionInput;
    }) => api.updateAcademicSession(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

export function useActivateAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.activateAcademicSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["terms"] });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

export function useDeleteAcademicSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteAcademicSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
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
    mutationFn: (data: CreateTermInput) =>
      api.createTerm(sessionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

export function useUpdateTerm(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTermInput }) =>
      api.updateTerm(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

export function useActivateTerm(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.activateTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) });
      queryClient.invalidateQueries({ queryKey: ["academic-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

export function useDeleteTerm(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteTerm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.terms(sessionId) });
      queryClient.invalidateQueries({ queryKey: ["academic-context"] });
    },
  });
}

// Class Levels
export const useClassLevels = (page = 1) =>
  useQuery({ queryKey: keys.classLevels(page), queryFn: () => api.getClassLevels(page) });

// Classes
export const useClasses = (pageOrFilters: number | ClassFilters = 1) =>
  useQuery({
    queryKey: keys.classes(pageOrFilters),
    queryFn: () => api.getClasses(pageOrFilters),
  });

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
      queryClient.invalidateQueries({ queryKey: ["class-levels"] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class-levels"] });
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
export const useSubjects = (pageOrFilters: number | SubjectFilters = 1) =>
  useQuery({
    queryKey: keys.subjects(pageOrFilters),
    queryFn: () => api.getSubjects(pageOrFilters),
  });

export const useSubjectDetail = (id: number) =>
  useQuery({
    queryKey: keys.subjectDetail(id),
    queryFn: () => api.getSubject(id),
    enabled: id > 0,
  });

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSubjectInput) => api.createSubject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateSubjectInput }) =>
      api.updateSubject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: keys.subjectDetail(id) });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
    },
  });
}

// Class Subjects (Offerings)
export const useClassSubjects = (filters?: ClassSubjectFilters) =>
  useQuery({
    queryKey: keys.classSubjects(filters),
    queryFn: () => api.getClassSubjects(filters),
  });

export function useCreateClassSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassSubjectInput) => api.createClassSubject(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: keys.classDetail(data.school_class_id) });
    },
  });
}

export function useUpdateClassSubjectStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      api.updateClassSubject(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
}

// Class <-> Subject assignment
export function useAssignSubjectToClass(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: number) => api.assignSubjectToClass(classId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useUnassignSubjectFromClass(classId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subjectId: number) => api.unassignSubjectFromClass(classId, subjectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.classDetail(classId) });
      queryClient.invalidateQueries({ queryKey: ["class-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

// Grading configuration
export const useGradingScales = (filters?: GradingScaleFilters) =>
  useQuery({
    queryKey: keys.gradingScales(filters),
    queryFn: () => api.getGradingScales(filters),
  });

export const useGradingScaleDetail = (id: number) =>
  useQuery({
    queryKey: keys.gradingScaleDetail(id),
    queryFn: () => api.getGradingScale(id),
    enabled: id > 0,
  });

export function useCreateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGradingScaleInput | Omit<GradingScale, "id">) =>
      api.createGradingScale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
    },
  });
}

export function useUpdateGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: UpdateGradingScaleInput | Omit<GradingScale, "id">;
    }) => api.updateGradingScale(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      queryClient.invalidateQueries({ queryKey: keys.gradingScaleDetail(variables.id) });
    },
  });
}

export function useArchiveGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (scale: GradingScale) => api.archiveGradingScale(scale),
    onSuccess: (_, scale) => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
      queryClient.invalidateQueries({ queryKey: keys.gradingScaleDetail(scale.id) });
    },
  });
}

export function useDeleteGradingScale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteGradingScale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["grading-scales"] });
    },
  });
}

export function useCalculateGrade() {
  return useMutation({
    mutationFn: ({ id, percentage }: { id: number; percentage: number }) =>
      api.calculateGrade(id, percentage),
  });
}


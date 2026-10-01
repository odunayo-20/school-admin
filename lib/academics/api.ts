import { apiClient } from "@/lib/api/client";
import { ACADEMIC_ENDPOINTS as E } from "@/lib/academics/endpoints";
import type {
  AcademicSession,
  ClassDetail,
  GradingScale,
  Paginated,
  School,
  SchoolClass,
  Section,
  Subject,
  Term,
} from "@/lib/academics/types";

// School (single profile)
export const getSchool = () => apiClient.get<School>(E.school);
export const updateSchool = (data: Omit<School, "id">) =>
  apiClient.put<School>(E.school, { ...data });

// Academic Sessions
export const getAcademicSessions = (page = 1) =>
  apiClient.get<Paginated<AcademicSession>>(`${E.academicSessions}?page=${page}`);
export const createAcademicSession = (data: Pick<AcademicSession, "name" | "start_date" | "end_date">) =>
  apiClient.post<AcademicSession>(E.academicSessions, { ...data });
export const updateAcademicSession = (
  id: number,
  data: Pick<AcademicSession, "name" | "start_date" | "end_date">
) => apiClient.put<AcademicSession>(E.academicSession(id), { ...data });
export const activateAcademicSession = (id: number) =>
  apiClient.post<AcademicSession>(E.activateAcademicSession(id));

// Terms (nested under a session)
export const getTerms = async (sessionId: number): Promise<Term[]> => {
  const res = await apiClient.get<any>(E.terms(sessionId));
  return Array.isArray(res) ? res : (res?.data ?? []);
};
export const createTerm = (
  sessionId: number,
  data: Pick<Term, "name" | "start_date" | "end_date">
) => apiClient.post<Term>(E.terms(sessionId), { ...data });
export const updateTerm = (id: number, data: Pick<Term, "name" | "start_date" | "end_date">) =>
  apiClient.put<Term>(E.term(id), { ...data });

// Classes
export const getClasses = (page = 1) => apiClient.get<Paginated<SchoolClass>>(`${E.classes}?page=${page}`);
export const getClass = (id: number) => apiClient.get<ClassDetail>(E.class(id));
export const createClass = (data: Pick<SchoolClass, "name" | "order">) =>
  apiClient.post<SchoolClass>(E.classes, { ...data });
export const updateClass = (id: number, data: Pick<SchoolClass, "name" | "order">) =>
  apiClient.put<SchoolClass>(E.class(id), { ...data });

// Sections (nested under a class)
export const createSection = (classId: number, data: Pick<Section, "name">) =>
  apiClient.post<Section>(E.sections(classId), { ...data });
export const updateSection = (id: number, data: Pick<Section, "name">) =>
  apiClient.put<Section>(E.section(id), { ...data });
export const deleteSection = (id: number) => apiClient.delete<void>(E.section(id));

// Subjects
export const getSubjects = (page = 1) => apiClient.get<Paginated<Subject>>(`${E.subjects}?page=${page}`);
export const createSubject = (data: Pick<Subject, "name" | "code">) =>
  apiClient.post<Subject>(E.subjects, { ...data });
export const updateSubject = (id: number, data: Pick<Subject, "name" | "code">) =>
  apiClient.put<Subject>(E.subject(id), { ...data });
export const deleteSubject = (id: number) => apiClient.delete<void>(E.subject(id));

// Class <-> Subject assignment
export const assignSubjectToClass = (classId: number, subjectId: number) =>
  apiClient.post<void>(E.classSubjects(classId), { subject_id: subjectId });
export const unassignSubjectFromClass = (classId: number, subjectId: number) =>
  apiClient.delete<void>(E.classSubject(classId, subjectId));

// Grading configuration
export const getGradingScales = async (): Promise<GradingScale[]> => {
  const res = await apiClient.get<any>(E.gradingScales);
  return Array.isArray(res) ? res : (res?.data ?? []);
};
export const createGradingScale = (data: Omit<GradingScale, "id">) =>
  apiClient.post<GradingScale>(E.gradingScales, { ...data });
export const updateGradingScale = (id: number, data: Omit<GradingScale, "id">) =>
  apiClient.put<GradingScale>(E.gradingScale(id), { ...data });
export const deleteGradingScale = (id: number) => apiClient.delete<void>(E.gradingScale(id));

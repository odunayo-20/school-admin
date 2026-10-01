import { apiClient } from "@/lib/api/client";
import { ACADEMIC_ENDPOINTS as E } from "@/lib/academics/endpoints";
import type {
  AcademicSession,
  ClassDetail,
  ClassLevel,
  CreateClassInput,
  CreateSectionInput,
  GradingScale,
  Paginated,
  School,
  SchoolClass,
  Section,
  Subject,
  Term,
  UpdateClassInput,
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

// Class Levels
export const getClassLevels = (page = 1) =>
  apiClient.get<Paginated<ClassLevel>>(`${E.classLevels}?page=${page}&active_only=true`);

// Classes
export const getClasses = (page = 1) => apiClient.get<Paginated<SchoolClass>>(`${E.classes}?page=${page}`);

export const getClass = async (id: number): Promise<ClassDetail> => {
  const [classData, sectionsRes, classSubjectsRes] = await Promise.all([
    apiClient.get<SchoolClass>(E.class(id)),
    apiClient.get<Paginated<Section>>(`${E.sections}?school_class_id=${id}`),
    apiClient.get<Paginated<{ id: number; subject: Subject; status: string }>>(
      `${E.classSubjects}?school_class_id=${id}&status=ACTIVE`
    ),
  ]);

  const sections = Array.isArray(sectionsRes?.data) ? sectionsRes.data : [];
  const subjects = Array.isArray(classSubjectsRes?.data)
    ? classSubjectsRes.data.map((item) => ({
        ...item.subject,
        class_subject_id: item.id,
      }))
    : [];

  return {
    ...classData,
    order: classData.sort_order ?? classData.order ?? 0,
    sections,
    subjects,
  };
};

export const createClass = (data: CreateClassInput) =>
  apiClient.post<SchoolClass>(E.classes, { ...data });

export const updateClass = (id: number, data: UpdateClassInput) =>
  apiClient.put<SchoolClass>(E.class(id), { ...data });

// Sections
export const createSection = (classId: number, data: CreateSectionInput) =>
  apiClient.post<Section>(E.sections, {
    school_class_id: classId,
    name: data.name,
    code: data.code || data.name.trim().toUpperCase(),
    sort_order: data.sort_order,
  });

export const updateSection = (id: number, data: Partial<CreateSectionInput>) =>
  apiClient.put<Section>(E.section(id), {
    ...data,
    code: data.code || (data.name ? data.name.trim().toUpperCase() : undefined),
  });

export const deleteSection = (id: number) => apiClient.delete<void>(E.section(id));

// Subjects
export const getSubjects = (page = 1) => apiClient.get<Paginated<Subject>>(`${E.subjects}?page=${page}`);
export const createSubject = (data: Pick<Subject, "name" | "code">) =>
  apiClient.post<Subject>(E.subjects, { ...data });
export const updateSubject = (id: number, data: Pick<Subject, "name" | "code">) =>
  apiClient.put<Subject>(E.subject(id), { ...data });
export const deleteSubject = (id: number) => apiClient.delete<void>(E.subject(id));

// Class <-> Subject assignment
export const assignSubjectToClass = async (classId: number, subjectId: number) => {
  const existing = await apiClient.get<Paginated<{ id: number; status: string }>>(
    `${E.classSubjects}?school_class_id=${classId}&subject_id=${subjectId}`
  );
  const existingItem = existing?.data?.[0];
  if (existingItem) {
    if (existingItem.status !== "ACTIVE") {
      await apiClient.put(E.classSubject(existingItem.id), { status: "ACTIVE" });
    }
    return;
  }
  await apiClient.post(E.classSubjects, { school_class_id: classId, subject_id: subjectId });
};

export const unassignSubjectFromClass = async (classId: number, subjectId: number) => {
  const existing = await apiClient.get<Paginated<{ id: number; status: string }>>(
    `${E.classSubjects}?school_class_id=${classId}&subject_id=${subjectId}&status=ACTIVE`
  );
  const existingItem = existing?.data?.[0];
  if (existingItem) {
    await apiClient.put(E.classSubject(existingItem.id), { status: "INACTIVE" });
  }
};

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

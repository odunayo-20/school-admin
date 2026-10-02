import { apiClient } from "@/lib/api/client";
import { ACADEMIC_ENDPOINTS as E } from "@/lib/academics/endpoints";
import type {
  AcademicContext,
  AcademicSession,
  AcademicSessionFilters,
  ClassDetail,
  ClassFilters,
  ClassLevel,
  CreateAcademicSessionInput,
  CreateClassInput,
  CreateGradingScaleInput,
  CreateSectionInput,
  CreateTermInput,
  GradingCalculationResult,
  GradingScale,
  GradingScaleFilters,
  Paginated,
  School,
  SchoolClass,
  Section,
  Subject,
  SubjectFilters,
  CreateSubjectInput,
  UpdateSubjectInput,
  ClassSubject,
  ClassSubjectFilters,
  CreateClassSubjectInput,
  UpdateClassSubjectInput,
  Term,
  UpdateAcademicSessionInput,
  UpdateClassInput,
  UpdateGradingScaleInput,
  UpdateSectionInput,
  UpdateTermInput,
} from "@/lib/academics/types";


// School & Context
export const getSchool = () => apiClient.get<School>(E.school);
export const getAcademicContext = () => apiClient.get<AcademicContext>(E.academicContext);
export const updateSchool = (data: Omit<School, "id">) =>
  apiClient.put<School>(E.school, { ...data });

// Academic Sessions
export const getAcademicSessions = (pageOrFilters: number | AcademicSessionFilters = 1) => {
  const query = new URLSearchParams();
  if (typeof pageOrFilters === "number") {
    query.set("page", String(pageOrFilters));
  } else {
    if (pageOrFilters.page) query.set("page", String(pageOrFilters.page));
    if (pageOrFilters.per_page) query.set("per_page", String(pageOrFilters.per_page));
    if (pageOrFilters.search?.trim()) query.set("search", pageOrFilters.search.trim());
    if (pageOrFilters.status) query.set("status", pageOrFilters.status);
  }
  const qs = query.toString();
  return apiClient.get<Paginated<AcademicSession>>(`${E.academicSessions}${qs ? `?${qs}` : ""}`);
};

export const createAcademicSession = (data: CreateAcademicSessionInput) =>
  apiClient.post<AcademicSession>(E.academicSessions, { ...data });

export const updateAcademicSession = (
  id: number,
  data: UpdateAcademicSessionInput
) => apiClient.put<AcademicSession>(E.academicSession(id), { ...data });

export const activateAcademicSession = (id: number) =>
  apiClient.post<AcademicSession>(E.activateAcademicSession(id));

export const deleteAcademicSession = (id: number) =>
  apiClient.delete<null>(E.deleteAcademicSession(id));

// Terms (nested under a session)
export const getTerms = async (sessionId: number): Promise<Term[]> => {
  const res = await apiClient.get<Term[] | { data: Term[] }>(E.terms(sessionId));
  return Array.isArray(res) ? res : (res?.data ?? []);
};

export const createTerm = (
  sessionId: number,
  data: CreateTermInput
) => apiClient.post<Term>(E.terms(sessionId), { ...data });

export const updateTerm = (id: number, data: UpdateTermInput) =>
  apiClient.put<Term>(E.term(id), { ...data });

export const activateTerm = (id: number) =>
  apiClient.post<Term>(E.activateTerm(id));

export const deleteTerm = (id: number) =>
  apiClient.delete<null>(E.deleteTerm(id));

// Class Levels
export const getClassLevels = (page = 1) =>
  apiClient.get<Paginated<ClassLevel>>(`${E.classLevels}?page=${page}&active_only=true`);

// Classes
export const getClasses = (pageOrFilters: number | ClassFilters = 1) => {
  const query = new URLSearchParams();
  if (typeof pageOrFilters === "number") {
    query.set("page", String(pageOrFilters));
  } else {
    if (pageOrFilters.page) query.set("page", String(pageOrFilters.page));
    if (pageOrFilters.per_page) query.set("per_page", String(pageOrFilters.per_page));
    if (pageOrFilters.search?.trim()) query.set("search", pageOrFilters.search.trim());
    if (pageOrFilters.class_level_id) query.set("class_level_id", String(pageOrFilters.class_level_id));
    if (pageOrFilters.status) query.set("status", pageOrFilters.status);
    if (pageOrFilters.active_only !== undefined) query.set("active_only", String(pageOrFilters.active_only));
  }
  const qs = query.toString();
  return apiClient.get<Paginated<SchoolClass>>(`${E.classes}${qs ? `?${qs}` : ""}`);
};

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

export const deleteClass = (id: number) => apiClient.delete<null>(E.class(id));

// Sections
export const createSection = (classId: number, data: CreateSectionInput) =>
  apiClient.post<Section>(E.sections, {
    school_class_id: classId,
    name: data.name,
    code: data.code || data.name.trim().toUpperCase(),
    sort_order: data.sort_order ?? 0,
    status: data.status,
  });

export const updateSection = (id: number, data: UpdateSectionInput) =>
  apiClient.put<Section>(E.section(id), {
    ...data,
    code: data.code || (data.name ? data.name.trim().toUpperCase() : undefined),
  });

export const deleteSection = (id: number) => apiClient.delete<void>(E.section(id));

// Subjects
export const getSubjects = async (
  pageOrFilters: number | SubjectFilters = 1
): Promise<Paginated<Subject>> => {
  const query = new URLSearchParams();
  if (typeof pageOrFilters === "number") {
    query.set("page", String(pageOrFilters));
  } else {
    if (pageOrFilters.page) query.set("page", String(pageOrFilters.page));
    if (pageOrFilters.per_page) query.set("per_page", String(pageOrFilters.per_page));
    if (pageOrFilters.search) query.set("search", pageOrFilters.search);
    if (pageOrFilters.code) query.set("code", pageOrFilters.code);
    if (pageOrFilters.status) query.set("status", pageOrFilters.status);
    if (pageOrFilters.active_only !== undefined) query.set("active_only", String(pageOrFilters.active_only));
  }

  const qs = query.toString();
  const url = qs ? `${E.subjects}?${qs}` : E.subjects;
  return apiClient.get<Paginated<Subject>>(url);
};

export const getSubject = (id: number) => apiClient.get<Subject>(E.subject(id));

export const createSubject = (data: CreateSubjectInput) =>
  apiClient.post<Subject>(E.subjects, {
    name: data.name,
    code: data.code.trim().toUpperCase(),
    sort_order: data.sort_order ?? 0,
    status: data.status ?? "ACTIVE",
  });

export const updateSubject = (id: number, data: UpdateSubjectInput) =>
  apiClient.put<Subject>(E.subject(id), {
    name: data.name,
    code: data.code.trim().toUpperCase(),
    sort_order: data.sort_order ?? 0,
    status: data.status ?? "ACTIVE",
  });

export const deleteSubject = (id: number) => apiClient.delete<void>(E.subject(id));

// Class Subjects (Offerings)
export const getClassSubjects = async (
  filters: ClassSubjectFilters = {}
): Promise<Paginated<ClassSubject>> => {
  const query = new URLSearchParams();
  if (filters.page) query.set("page", String(filters.page));
  if (filters.per_page) query.set("per_page", String(filters.per_page));
  if (filters.school_class_id) query.set("school_class_id", String(filters.school_class_id));
  if (filters.subject_id) query.set("subject_id", String(filters.subject_id));
  if (filters.status) query.set("status", filters.status);

  const qs = query.toString();
  const url = qs ? `${E.classSubjects}?${qs}` : E.classSubjects;
  return apiClient.get<Paginated<ClassSubject>>(url);
};

export const getClassSubject = (id: number) =>
  apiClient.get<ClassSubject>(E.classSubject(id));

export const createClassSubject = (data: CreateClassSubjectInput) =>
  apiClient.post<ClassSubject>(E.classSubjects, {
    school_class_id: data.school_class_id,
    subject_id: data.subject_id,
  });

export const updateClassSubject = (id: number, data: UpdateClassSubjectInput) =>
  apiClient.put<ClassSubject>(E.classSubject(id), { status: data.status });

// Class <-> Subject assignment helpers
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
export const getGradingScales = async (
  filters: GradingScaleFilters = {}
): Promise<GradingScale[] & { meta?: Paginated<GradingScale>["meta"] }> => {
  const query = new URLSearchParams();
  if (filters.page) query.set("page", String(filters.page));
  if (filters.per_page) query.set("per_page", String(filters.per_page));
  if (filters.search) query.set("search", filters.search);
  if (filters.class_level_id) query.set("class_level_id", String(filters.class_level_id));
  if (filters.status) query.set("status", filters.status);
  if (filters.active_only !== undefined) query.set("active_only", String(filters.active_only));

  const qs = query.toString();
  const url = qs ? `${E.gradingScales}?${qs}` : E.gradingScales;
  const res = await apiClient.get<Paginated<GradingScale> | { data: GradingScale[] } | GradingScale[]>(url);

  const items: GradingScale[] = Array.isArray(res) ? res : (res?.data ?? []);
  const meta = (res && typeof res === "object" && "meta" in res) ? (res as Paginated<GradingScale>).meta : undefined;
  return Object.assign([...items], { meta });
};

export const getGradingScale = async (id: number): Promise<GradingScale> => {
  const res = await apiClient.get<{ data: GradingScale } | GradingScale>(E.gradingScale(id));
  return (res && "data" in res && res.data) ? res.data : (res as GradingScale);
};

export const createGradingScale = async (
  data: CreateGradingScaleInput | Omit<GradingScale, "id">
): Promise<GradingScale> => {
  const res = await apiClient.post<{ data: GradingScale } | GradingScale>(
    E.gradingScales,
    data as unknown as Record<string, unknown>
  );
  return (res && "data" in res && res.data) ? res.data : (res as GradingScale);
};

export const updateGradingScale = async (
  id: number,
  data: UpdateGradingScaleInput | Omit<GradingScale, "id">
): Promise<GradingScale> => {
  const res = await apiClient.put<{ data: GradingScale } | GradingScale>(
    E.gradingScale(id),
    data as unknown as Record<string, unknown>
  );
  return (res && "data" in res && res.data) ? res.data : (res as GradingScale);
};

export const calculateGrade = async (
  id: number,
  percentage: number
): Promise<GradingCalculationResult> => {
  const res = await apiClient.post<{ data: GradingCalculationResult } | GradingCalculationResult>(
    E.calculateGrade(id),
    { percentage }
  );
  return (res && "data" in res && res.data) ? res.data : (res as GradingCalculationResult);
};

export const archiveGradingScale = async (scale: GradingScale): Promise<GradingScale> => {
  return updateGradingScale(scale.id, {
    name: scale.name,
    code: scale.code,
    sort_order: scale.sort_order ?? 0,
    status: "ARCHIVED",
    items: (scale.items ?? []).map((item) => ({
      grade: item.grade,
      min_percentage: Number(item.min_percentage),
      max_percentage: Number(item.max_percentage),
      grade_point: item.grade_point !== null && item.grade_point !== undefined ? Number(item.grade_point) : null,
      remark: item.remark ?? null,
    })),
  });
};

export const deleteGradingScale = async (id: number): Promise<void> => {
  // Backend returns 405 Method Not Allowed for DELETE /grading-scales/{id}.
  // We fetch and archive the scale to retire it safely.
  const scale = await getGradingScale(id);
  await archiveGradingScale(scale);
};


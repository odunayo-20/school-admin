/**
 * PROPOSED CONTRACT for Module 02 (School Configuration & Academic
 * Foundation). No Laravel backend exists yet for this project — per the
 * project owner's direction, the frontend is being built ahead of it, so
 * these types describe a reasonable, RESTful contract rather than a
 * confirmed one. Reconcile field names/shapes here once the real API
 * exists; see lib/academics/endpoints.ts for the assumed routes.
 */

export interface Paginated<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface School {
  id: number;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  email: string | null;
}

export interface AcademicContext {
  school: { id: number; name: string; short_name?: string; status: string } | null;
  session: { id: number; name: string; start_date: string; end_date: string; status: string } | null;
  term: { id: number; academic_session_id: number; name: string; term_number: number; start_date: string; end_date: string; status: string } | null;
}

export interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED" | string;
  created_at?: string;
  updated_at?: string;
}

export interface Term {
  id: number;
  academic_session_id: number;
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
  is_current: boolean;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED" | string;
  created_at?: string;
  updated_at?: string;
  academic_session?: {
    id: number;
    name: string;
    status: string;
  } | null;
}

export interface CreateAcademicSessionInput {
  name: string;
  start_date: string;
  end_date: string;
}

export interface UpdateAcademicSessionInput {
  name: string;
  start_date: string;
  end_date: string;
}

export interface AcademicSessionFilters {
  page?: number;
  per_page?: number;
  search?: string;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED" | "";
}

export interface CreateTermInput {
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
}

export interface UpdateTermInput {
  name: string;
  term_number: number;
  start_date: string;
  end_date: string;
}

export interface ClassLevel {
  id: number;
  name: string;
  code: string;
  sort_order?: number;
  status: string;
  classes_count?: number;
}

export interface SchoolClass {
  id: number;
  class_level_id: number;
  class_level?: {
    id: number;
    name: string;
    code: string;
  } | null;
  name: string;
  code: string;
  sort_order?: number;
  order?: number;
  status?: string;
  sections_count?: number;
  subjects_count?: number;
}

export interface ClassFilters {
  page?: number;
  per_page?: number;
  search?: string;
  class_level_id?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  active_only?: boolean;
}

export interface CreateClassInput {
  class_level_id: number;
  name: string;
  code: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface UpdateClassInput {
  class_level_id?: number;
  name?: string;
  code?: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface ClassDetail extends SchoolClass {
  sections: Section[];
  subjects: (Subject & { class_subject_id?: number })[];
}

export interface Section {
  id: number;
  class_id?: number;
  school_class_id?: number;
  school_class?: {
    id: number;
    name: string;
    code: string;
  } | null;
  name: string;
  code?: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  students_count?: number;
}

export interface CreateSectionInput {
  name: string;
  code?: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface UpdateSectionInput {
  name?: string;
  code?: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  class_subjects_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectFilters {
  page?: number;
  per_page?: number;
  search?: string;
  code?: string;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "";
  active_only?: boolean;
}

export interface CreateSubjectInput {
  name: string;
  code: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface UpdateSubjectInput {
  name: string;
  code: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface ClassSubject {
  id: number;
  school_class_id?: number;
  school_class?: SchoolClass;
  subject_id?: number;
  subject?: Subject;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  created_at?: string;
  updated_at?: string;
}

export interface ClassSubjectFilters {
  page?: number;
  per_page?: number;
  school_class_id?: number;
  subject_id?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "";
}

export interface CreateClassSubjectInput {
  school_class_id: number;
  subject_id: number;
}

export interface UpdateClassSubjectInput {
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
}

export interface GradingScaleItem {
  id?: number;
  grade: string;
  min_percentage: number | string;
  max_percentage: number | string;
  grade_point?: number | string | null;
  remark?: string | null;
  // Legacy aliases
  min_score?: number;
  max_score?: number;
}

export interface GradingScale {
  id: number;
  name: string;
  code: string;
  sort_order?: number;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  class_level_id?: number;
  class_level?: {
    id: number;
    name: string;
    code: string;
    status: string;
  } | null;
  items?: GradingScaleItem[];
  created_at?: string;
  updated_at?: string;

  // Legacy flat fields for backward compatibility
  grade?: string;
  min_percentage?: number;
  max_percentage?: number;
  min_score?: number;
  max_score?: number;
  grade_point?: number;
  remark?: string | null;
}

export interface GradingScaleFilters {
  page?: number;
  per_page?: number;
  search?: string;
  class_level_id?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "";
  active_only?: boolean;
}

export interface GradingScaleItemInput {
  id?: number;
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_point?: number | null;
  remark?: string | null;
}

export interface CreateGradingScaleInput {
  class_level_id: number;
  name: string;
  code: string;
  sort_order?: number;
  items: GradingScaleItemInput[];
}

export interface UpdateGradingScaleInput {
  name: string;
  code: string;
  sort_order?: number;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED" | string;
  items: GradingScaleItemInput[];
}

export interface GradingCalculationResult {
  percentage: number;
  grade: string | null;
  grade_point: string | null;
  remark: string | null;
  matched_band: GradingScaleItem | null;
}


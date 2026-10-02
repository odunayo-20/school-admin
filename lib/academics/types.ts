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
}

export interface GradingScaleItem {
  id?: number;
  grade: string;
  min_percentage?: number;
  max_percentage?: number;
  min_score?: number;
  max_score?: number;
  grade_point: number;
  remark: string | null;
}

export interface GradingScale {
  id: number;
  name?: string;
  code?: string;
  class_level_id?: number;
  status?: string;
  items?: GradingScaleItem[];
  grade?: string;
  min_percentage?: number;
  max_percentage?: number;
  min_score?: number;
  max_score?: number;
  grade_point?: number;
  remark?: string | null;
}

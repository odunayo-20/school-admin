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

export interface AcademicSession {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Term {
  id: number;
  academic_session_id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface SchoolClass {
  id: number;
  name: string;
  order: number;
  sections_count?: number;
  subjects_count?: number;
}

export interface ClassDetail extends SchoolClass {
  sections: Section[];
  subjects: Subject[];
}

export interface Section {
  id: number;
  class_id: number;
  name: string;
}

export interface Subject {
  id: number;
  name: string;
  code: string;
}

export interface GradingScale {
  id: number;
  grade: string;
  min_score: number;
  max_score: number;
  grade_point: number;
  remark: string | null;
}

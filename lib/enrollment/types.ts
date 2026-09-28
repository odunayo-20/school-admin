/**
 * PROPOSED, READ-ONLY contract for viewing which students are enrolled in a
 * class (Module 05's class roster). No Laravel backend exists in this
 * workspace, and — importantly — Module 03 (Admissions, Students &
 * Enrollment), which owns student/enrollment records, was never built
 * either. This module intentionally does NOT create a parallel enrollment
 * system: there is no create/edit/delete here, only a read of whatever the
 * real Module 03 API will expose. Once that exists, reconcile this file and
 * delete this notice.
 */

export interface RosterStudent {
  id: number;
  student_no: string;
  name: string;
  section: { id: number; name: string } | null;
  enrollment_status: "active" | "inactive";
}

export interface RosterFilters {
  academic_session_id: number;
  section_id?: number;
  search?: string;
  page?: number;
}

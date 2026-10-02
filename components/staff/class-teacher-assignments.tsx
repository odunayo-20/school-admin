"use client";

import { Info } from "lucide-react";

/**
 * Class teacher / Form teacher assignments.
 *
 * In the Laravel API specification (Module 08 Architecture Audit), the backend
 * explicitly documents that teacher assignments are managed on a per-subject basis
 * (`/api/v1/teacher-assignments`). A separate pastoral "form teacher / class teacher"
 * concept is not part of the active academic curriculum schema.
 *
 * This component is retained for backward compatibility.
 */
export function ClassTeacherAssignments({ staffId: _staffId }: { staffId: number }) {
  return null;
}

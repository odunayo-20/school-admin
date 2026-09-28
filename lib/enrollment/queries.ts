"use client";

import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/enrollment/api";
import type { RosterFilters } from "@/lib/enrollment/types";

export const useClassRoster = (classId: number, filters: RosterFilters) =>
  useQuery({
    queryKey: ["classes", classId, "roster", filters],
    queryFn: () => api.getClassRoster(classId, filters),
    enabled: classId > 0 && filters.academic_session_id > 0,
  });

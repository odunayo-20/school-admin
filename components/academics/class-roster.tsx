"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useClassRoster } from "@/lib/enrollment/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { Section } from "@/lib/academics/types";

/**
 * Read-only. There is no student/enrollment management here — that belongs
 * to Module 03. This only displays whichever students the (proposed)
 * roster endpoint returns for the selected session/section.
 */
export function ClassRoster({
  classId,
  academicSessionId,
  sections,
}: {
  classId: number;
  academicSessionId: number;
  sections: Section[];
}) {
  const [search, setSearch] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const rosterQuery = useClassRoster(classId, {
    academic_session_id: academicSessionId,
    section_id: sectionId ? Number(sectionId) : undefined,
    search: debouncedSearch || undefined,
    page,
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Student roster</h2>
        <div className="flex flex-wrap items-end gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              placeholder="Search students"
              className="w-48 pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {sections.length > 0 && (
            <Select
              className="w-32"
              value={sectionId}
              onChange={(e) => {
                setSectionId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {rosterQuery.isPending && <LoadingState label="Loading roster…" />}
      {rosterQuery.isError && <ErrorState error={rosterQuery.error} onRetry={() => rosterQuery.refetch()} />}

      {rosterQuery.isSuccess && rosterQuery.data.data.length === 0 && (
        <EmptyState
          title={debouncedSearch || sectionId ? "No students match these filters." : "No students enrolled yet."}
          description={
            debouncedSearch || sectionId
              ? "Try adjusting your search or section filter."
              : "Student enrollment is managed elsewhere in the system."
          }
        />
      )}

      {rosterQuery.isSuccess && rosterQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Section</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rosterQuery.data.data.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.student_no}</TableCell>
                  <TableCell>{student.section?.name ?? "—"}</TableCell>
                  <TableCell>
                    {student.enrollment_status === "active" ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={rosterQuery.data.meta.current_page}
            lastPage={rosterQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </section>
  );
}

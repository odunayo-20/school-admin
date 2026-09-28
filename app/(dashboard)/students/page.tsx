"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManageStudents } from "@/lib/auth/permissions";
import { useStudentList } from "@/lib/students/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { StudentStatus } from "@/lib/students/types";

function statusBadge(status: StudentStatus) {
  if (status === "active") return <Badge>Active</Badge>;
  return <Badge variant="outline">{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

function StudentsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const studentsQuery = useStudentList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    page,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label htmlFor="student-search" className="text-xs font-medium text-muted-foreground">
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="student-search"
              placeholder="Name or student no."
              className="w-64 pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label htmlFor="student-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select
            id="student-status"
            className="w-36"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StudentStatus | "");
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
        </div>
      </div>

      {studentsQuery.isPending && <LoadingState label="Loading students…" />}
      {studentsQuery.isError && (
        <ErrorState error={studentsQuery.error} onRetry={() => studentsQuery.refetch()} />
      )}

      {studentsQuery.isSuccess && studentsQuery.data.data.length === 0 && (
        <EmptyState
          title={debouncedSearch || status ? "No students match these filters." : "No students found."}
          description={
            debouncedSearch || status
              ? "Try adjusting your search or status filter."
              : "Students are created by approving an admission."
          }
          action={
            !(debouncedSearch || status) && (
              <Link href="/admissions" className={buttonVariants({ size: "sm" })}>
                Go to Admissions
              </Link>
            )
          }
        />
      )}

      {studentsQuery.isSuccess && studentsQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student no.</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsQuery.data.data.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.student_no}</TableCell>
                  <TableCell>
                    {student.current_enrollment
                      ? `${student.current_enrollment.class.name}${
                          student.current_enrollment.section ? ` - ${student.current_enrollment.section.name}` : ""
                        }`
                      : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(student.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/students/${student.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={studentsQuery.data.meta.current_page}
            lastPage={studentsQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function StudentsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Students</h1>
        <p className="text-sm text-muted-foreground">
          All students admitted into the school. New students are added via Admissions.
        </p>
      </div>
      <AdminOnly
        check={canManageStudents}
        description="Student records are managed by school administrators and registrars."
      >
        <StudentsList />
      </AdminOnly>
    </main>
  );
}

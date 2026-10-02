"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageStudents } from "@/lib/auth/permissions";
import { useStudentList } from "@/lib/students/queries";
import { useClasses } from "@/lib/academics/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { StudentListItem, StudentStatus } from "@/lib/students/types";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: StudentStatus | string }) {
  const normalized = (status || "active").toLowerCase();

  switch (normalized) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case "graduated":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
          <GraduationCap className="h-3 w-3" />
          Graduated
        </span>
      );
    case "inactive":
      return (
        <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Inactive
        </span>
      );
    case "withdrawn":
      return (
        <span className="inline-flex items-center rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          Withdrawn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
          {status}
        </span>
      );
  }
}

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function StudentsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StudentStatus | "">("");
  const [classId, setClassId] = useState<string>("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  // Queries
  const classesQuery = useClasses(1);
  const classes = classesQuery.data?.data ?? [];

  const studentsQuery = useStudentList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    class_id: classId ? Number(classId) : undefined,
    page,
  });

  const students = studentsQuery.data?.data ?? [];
  const meta = studentsQuery.data?.meta;
  const totalStudents = meta?.total ?? students.length;

  const hasActiveFilters = Boolean(search || status || classId);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setClassId("");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* 1. ROSTER DEMOGRAPHIC KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Enrolled */}
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Enrolled
              </p>
              {studentsQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalStudents}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span>Registered learners</span>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
              Roster
            </span>
          </div>
        </div>

        {/* Card 2: Active Learners */}
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Status
              </p>
              {studentsQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {students.filter((s) => s.status === "active").length || totalStudents}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span>In regular attendance</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
              Active
            </span>
          </div>
        </div>

        {/* Card 3: Classes Represented */}
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Assigned Classes
              </p>
              {classesQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {classes.length}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span>Instructional classes</span>
            <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
              Placements
            </span>
          </div>
        </div>

        {/* Card 4: Admissions Intake Source */}
        <Link
          href="/admissions"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Intake Gateway
              </p>
              <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                Admissions
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white dark:text-amber-400">
              <Plus className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <span>Enroll new student</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      </div>

      {/* 2. ADVANCED FILTER TOOLBAR */}
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-border/70 bg-card p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="student-search"
              placeholder="Search name or ID..."
              className="h-9 w-full pl-9 text-xs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Class Selector Dropdown */}
          <div className="w-full sm:w-44">
            <Select
              id="student-class"
              className="h-9 text-xs"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Status Dropdown */}
          <div className="w-full sm:w-36">
            <Select
              id="student-status"
              className="h-9 text-xs"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StudentStatus | "");
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="graduated">Graduated</option>
              <option value="withdrawn">Withdrawn</option>
            </Select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        {/* Counter readout */}
        <div className="text-xs text-muted-foreground">
          {studentsQuery.isSuccess && (
            <span>
              Showing <strong className="font-semibold text-foreground">{students.length}</strong> of{" "}
              <strong className="font-semibold text-foreground">{totalStudents}</strong> students
            </span>
          )}
        </div>
      </div>

      {/* 3. STUDENTS ROSTER TABLE & ZERO-STATE */}
      <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
        {studentsQuery.isPending ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-none">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ))}
          </div>
        ) : studentsQuery.isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-center p-6">
            <AlertCircle className="h-10 w-10 text-destructive mb-3" />
            <h3 className="text-sm font-semibold text-foreground">Failed to load student records</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              An error occurred while connecting to the student registry service.
            </p>
            <button
              type="button"
              onClick={() => studentsQuery.refetch()}
              className={cn(buttonVariants({ size: "sm" }), "mt-4")}
            >
              Try again
            </button>
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {hasActiveFilters ? "No students match your filter criteria" : "No students admitted yet"}
            </h3>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {hasActiveFilters
                ? "Try modifying your search query or removing class/status filter selections."
                : "New students are officially registered by approving applications in the Admissions intake module."}
            </p>
            <div className="mt-4 flex items-center gap-2">
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Clear all filters
                </button>
              ) : (
                <Link
                  href="/admissions"
                  className={cn(buttonVariants({ size: "sm" }))}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Go to Admissions Intake
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="font-semibold text-xs">Learner</TableHead>
                  <TableHead className="font-semibold text-xs">Student ID</TableHead>
                  <TableHead className="font-semibold text-xs">Current Class & Arm</TableHead>
                  <TableHead className="font-semibold text-xs">Academic Session</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => {
                  const displayName =
                    student.full_name ||
                    student.name ||
                    [student.first_name, student.last_name].filter(Boolean).join(" ") ||
                    "Learner Record";
                  const displayNo =
                    student.student_number || student.student_no || `STU-${student.id}`;
                  const enrollment = student.current_enrollment;

                  return (
                    <TableRow
                      key={student.id}
                      className="transition-colors hover:bg-muted/40"
                    >
                      {/* Learner Name & Avatar */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-xs text-primary">
                            {getInitials(displayName)}
                          </div>
                          <div>
                            <Link
                              href={`/students/${student.id}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {displayName}
                            </Link>
                            {student.gender && (
                              <p className="text-[11px] text-muted-foreground capitalize">
                                {student.gender}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Student ID */}
                      <TableCell>
                        <span className="font-mono text-xs font-semibold rounded bg-muted/70 px-2 py-0.5 text-foreground">
                          {displayNo}
                        </span>
                      </TableCell>

                      {/* Class & Section */}
                      <TableCell>
                        {enrollment?.class ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-foreground text-xs">
                              {enrollment.class.name}
                            </span>
                            {enrollment.section && (
                              <span className="rounded border border-border/80 bg-background px-1.5 py-0.2 text-[10px] font-medium text-muted-foreground">
                                {enrollment.section.name}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Unallocated
                          </span>
                        )}
                      </TableCell>

                      {/* Academic Session */}
                      <TableCell className="text-xs text-muted-foreground">
                        {enrollment?.academic_session?.name || "Current Year"}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={student.status} />
                      </TableCell>

                      {/* Action */}
                      <TableCell className="text-right">
                        <Link
                          href={`/students/${student.id}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "h-8 text-xs font-medium text-primary hover:text-primary"
                          )}
                        >
                          View Profile
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {meta && meta.last_page > 1 && (
              <div className="border-t border-border/60 p-4">
                <PaginationControls
                  page={meta.current_page}
                  lastPage={meta.last_page}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            <span>Learner Directory & Registry</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Students Directory
          </h1>
          <p className="text-sm text-muted-foreground">
            Official roll of all admitted students, class placements, and academic lifecycles.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/promotions"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Promotions Engine
          </Link>
          <Link
            href="/academics/classes"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Layers className="mr-1.5 h-3.5 w-3.5" />
            Class Placements
          </Link>
          <Link
            href="/admissions"
            className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Admission
          </Link>
        </div>
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

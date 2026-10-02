"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
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
  XCircle,
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
import { canManageAdmissions } from "@/lib/auth/permissions";
import { useAdmissionList } from "@/lib/admissions/queries";
import { useAcademicSessions, useClassLevels } from "@/lib/academics/queries";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AdmissionListItem, AdmissionStatus } from "@/lib/admissions/types";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: AdmissionStatus | string }) {
  const norm = (status || "PENDING").toUpperCase();

  switch (norm) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Review
        </span>
      );
    case "ADMITTED":
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Admitted
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    case "WITHDRAWN":
      return (
        <span className="inline-flex items-center rounded-full border border-muted-foreground/30 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
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
  if (!name) return "AD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function AdmissionsList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [classLevelId, setClassLevelId] = useState<string>("");
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search);

  // Queries
  const sessionsQuery = useAcademicSessions(1);
  const classLevelsQuery = useClassLevels(1);

  const admissionsQuery = useAdmissionList({
    search: debouncedSearch || undefined,
    status: status || undefined,
    academic_session_id: sessionId ? Number(sessionId) : undefined,
    entry_class_level_id: classLevelId ? Number(classLevelId) : undefined,
    page,
  });

  const admissions = admissionsQuery.data?.data ?? [];
  const meta = admissionsQuery.data?.meta;
  const totalAdmissions = meta?.total ?? admissions.length;

  const hasActiveFilters = Boolean(search || status || sessionId || classLevelId);

  const handleResetFilters = () => {
    setSearch("");
    setStatus("");
    setSessionId("");
    setClassLevelId("");
    setPage(1);
  };

  // Compute metrics from current data or fallback
  const counts = useMemo(() => {
    let pending = 0;
    let admitted = 0;
    let rejected = 0;
    let withdrawn = 0;

    admissions.forEach((a) => {
      const s = (a.status || "").toUpperCase();
      if (s === "PENDING") pending++;
      else if (s === "ADMITTED" || s === "APPROVED") admitted++;
      else if (s === "REJECTED") rejected++;
      else if (s === "WITHDRAWN") withdrawn++;
    });

    return { pending, admitted, rejected, withdrawn };
  }, [admissions]);

  return (
    <div className="space-y-6">
      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Applications
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {admissionsQuery.isPending ? "…" : totalAdmissions}
            </span>
            <span className="text-xs text-muted-foreground">recorded candidates</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Intake pipeline across all sessions
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-card p-5 shadow-xs transition-all hover:border-amber-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {admissionsQuery.isPending ? "…" : counts.pending}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Action required
            </span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Awaiting admission committee decision
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-emerald-500/20 bg-card p-5 shadow-xs transition-all hover:border-emerald-500/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Admitted Pupils
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {admissionsQuery.isPending ? "…" : counts.admitted}
            </span>
            <span className="text-xs text-muted-foreground">students created</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Successfully accepted & ready for class placement
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 shadow-xs transition-all hover:border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Declined / Withdrawn
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-foreground">
              {admissionsQuery.isPending ? "…" : counts.rejected + counts.withdrawn}
            </span>
            <span className="text-xs text-muted-foreground">archived records</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Historical audit log maintained
          </div>
        </div>
      </div>

      {/* Advanced Filter Toolbar */}
      <div className="rounded-xl border border-border/70 bg-card p-4 shadow-xs">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative min-w-[260px] flex-1 sm:max-w-xs">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  id="admission-search"
                  placeholder="Applicant name, admission no…"
                  className="h-9 pl-9 text-sm"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Status Filter */}
              <div className="w-full sm:w-auto">
                <Select
                  id="admission-status"
                  className="h-9 w-full sm:w-40 text-xs"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">Pending Review</option>
                  <option value="ADMITTED">Admitted</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </Select>
              </div>

              {/* Academic Session Filter */}
              <div className="w-full sm:w-auto">
                <Select
                  id="admission-session"
                  className="h-9 w-full sm:w-44 text-xs"
                  value={sessionId}
                  onChange={(e) => {
                    setSessionId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Academic Sessions</option>
                  {sessionsQuery.data?.data.map((sess) => (
                    <option key={sess.id} value={sess.id}>
                      {sess.name} {sess.status === "ACTIVE" || (sess.status as string) === "active" ? "(Active)" : ""}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Class Level Filter */}
              <div className="w-full sm:w-auto">
                <Select
                  id="admission-class-level"
                  className="h-9 w-full sm:w-40 text-xs"
                  value={classLevelId}
                  onChange={(e) => {
                    setClassLevelId(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Entry Levels</option>
                  {classLevelsQuery.data?.data.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.name} ({lvl.code})
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
              <Link
                href="/admissions/new"
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shadow-xs")}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Record Application
              </Link>
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <span className="font-medium flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              {debouncedSearch && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                  Keyword: &quot;{debouncedSearch}&quot;
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setSearch("");
                      setPage(1);
                    }}
                  />
                </span>
              )}
              {status && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                  Status: {status}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setStatus("");
                      setPage(1);
                    }}
                  />
                </span>
              )}
              {sessionId && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                  Session: {sessionsQuery.data?.data.find((s) => String(s.id) === sessionId)?.name || sessionId}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setSessionId("");
                      setPage(1);
                    }}
                  />
                </span>
              )}
              {classLevelId && (
                <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground">
                  Level: {classLevelsQuery.data?.data.find((l) => String(l.id) === classLevelId)?.name || classLevelId}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={() => {
                      setClassLevelId("");
                      setPage(1);
                    }}
                  />
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {admissionsQuery.isPending && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {admissionsQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <h3 className="font-semibold text-foreground">Failed to load admissions queue</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {admissionsQuery.error instanceof Error
              ? admissionsQuery.error.message
              : "An unexpected error occurred while communicating with the admissions service."}
          </p>
          <button
            onClick={() => admissionsQuery.refetch()}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Try again
          </button>
        </div>
      )}

      {/* Empty State */}
      {admissionsQuery.isSuccess && admissions.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 bg-card/50 p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base font-semibold text-foreground">
              {hasActiveFilters ? "No applications match your criteria" : "Admissions queue is empty"}
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {hasActiveFilters
                ? "Try clearing or relaxing your filters to discover applicant records."
                : "No student applications have been logged for this intake cycle yet."}
            </p>
          </div>
          <div className="pt-2">
            {hasActiveFilters ? (
              <button
                onClick={handleResetFilters}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear all filters
              </button>
            ) : (
              <Link
                href="/admissions/new"
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5")}
              >
                <Plus className="h-4 w-4" />
                Record First Application
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Data Table */}
      {admissionsQuery.isSuccess && admissions.length > 0 && (
        <div className="rounded-xl border border-border/70 bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[30%]">Applicant</TableHead>
                <TableHead className="w-[18%]">Target Intake</TableHead>
                <TableHead className="w-[16%]">Demographics</TableHead>
                <TableHead className="w-[16%]">Status</TableHead>
                <TableHead className="w-[10%]">Applied Date</TableHead>
                <TableHead className="text-right w-[10%]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admissions.map((admission) => {
                const fullName = admission.full_name || admission.applicant_name || "Applicant";
                const initials = getInitials(fullName);
                const isAdmitted =
                  admission.status === "ADMITTED" ||
                  (admission.status as string) === "approved";
                const linkedStudentId = admission.student?.id ?? admission.student_id;

                return (
                  <TableRow
                    key={admission.id}
                    className="hover:bg-muted/30 transition-colors group"
                  >
                    {/* Applicant Name & Admission No */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                          {initials}
                        </div>
                        <div className="space-y-0.5">
                          <Link
                            href={`/admissions/${admission.id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 group-hover:underline"
                          >
                            <span>{fullName}</span>
                          </Link>
                          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            <span>{admission.admission_number || admission.admission_no || `ADM-${admission.id}`}</span>
                            {admission.notes && (
                              <span className="text-[10px] text-muted-foreground/80 italic max-w-[150px] truncate" title={admission.notes}>
                                • {admission.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Target Intake & Entry Level */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-foreground">
                          {admission.academic_session?.name || "Session unassigned"}
                        </div>
                        <div className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-medium">
                          {admission.entry_class_level?.name || admission.intended_class?.name || "General"}
                        </div>
                      </div>
                    </TableCell>

                    {/* Demographics: Gender & DOB */}
                    <TableCell>
                      <div className="space-y-0.5 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="capitalize">{admission.gender ? admission.gender.toLowerCase() : "Unspecified"}</span>
                        </div>
                        {admission.date_of_birth && (
                          <div className="text-[11px] text-muted-foreground/80">
                            DOB: {admission.date_of_birth}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <StatusBadge status={admission.status} />
                    </TableCell>

                    {/* Applied Date */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {admission.created_at ? admission.created_at.slice(0, 10) : admission.application_date || "—"}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isAdmitted && linkedStudentId ? (
                          <Link
                            href={`/students/${linkedStudentId}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "sm" }),
                              "h-8 px-2.5 text-xs gap-1 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                            )}
                            title="View student profile"
                          >
                            <span>Pupil</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </Link>
                        ) : null}

                        <Link
                          href={`/admissions/${admission.id}`}
                          className={cn(
                            buttonVariants({
                              variant: admission.status === "PENDING" ? "default" : "outline",
                              size: "sm",
                            }),
                            "h-8 px-3 text-xs gap-1"
                          )}
                        >
                          <span>{admission.status === "PENDING" ? "Review" : "View"}</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination Controls */}
          {meta && meta.last_page > 1 && (
            <div className="border-t border-border/70 p-4">
              <PaginationControls
                page={meta.current_page}
                lastPage={meta.last_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdmissionsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Admissions & Intake Queue</h1>
        <p className="text-sm text-muted-foreground">
          Review candidate applications, manage decisions, and onboard accepted pupils into the active student register.
        </p>
      </div>

      <AdminOnly
        check={canManageAdmissions}
        description="Admissions are managed by school administrators and registrars."
      >
        <AdmissionsList />
      </AdminOnly>
    </main>
  );
}

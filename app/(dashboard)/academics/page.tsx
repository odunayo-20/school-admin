"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  Percent,
  Plus,
  School as SchoolIcon,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { canManageStaff } from "@/lib/auth/permissions";
import {
  useAcademicContext,
  useAcademicSessions,
  useClasses,
  useClassLevels,
  useGradingScaleDetail,
  useGradingScales,
  useSubjects,
  useTerms,
} from "@/lib/academics/queries";
import { useStaffList } from "@/lib/staff/queries";
import { cn } from "@/lib/utils";

function AcademicOverviewContent() {
  const [subjectSearch, setSubjectSearch] = useState("");

  // Parallel API queries
  const contextQuery = useAcademicContext();
  const sessionsQuery = useAcademicSessions(1);
  const classLevelsQuery = useClassLevels();
  const classesQuery = useClasses(1);
  const subjectsQuery = useSubjects(1);
  const teachersQuery = useStaffList({ is_teacher: true, status: "active", page: 1 });
  const gradingQuery = useGradingScales();

  // Resolved context data
  const context = contextQuery.data;
  const sessions = sessionsQuery.data?.data ?? [];
  const currentSession =
    sessions.find((s) => s.is_current) ?? context?.session ?? null;

  const termsQuery = useTerms(currentSession?.id ?? 0);
  const terms = termsQuery.data ?? [];
  const currentTerm = terms.find((t) => t.is_current) ?? context?.term ?? null;

  const classes = classesQuery.data?.data ?? [];
  const totalClasses = classesQuery.data?.meta.total ?? 0;
  const classLevels = classLevelsQuery.data?.data ?? [];
  const subjects = subjectsQuery.data?.data ?? [];
  const totalSubjects = subjectsQuery.data?.meta.total ?? subjects.length;
  const totalTeachers = teachersQuery.data?.meta.total ?? 0;
  const gradingScales = gradingQuery.data ?? [];
  const activeScale =
    gradingScales.find((s) => s.status === "ACTIVE") ?? gradingScales[0] ?? null;

  // Detail query to load full bands for active scale (since list endpoint omits items)
  const activeScaleDetailQuery = useGradingScaleDetail(activeScale?.id ?? 0);
  const resolvedActiveScale = activeScaleDetailQuery.data ?? activeScale;

  const gradeBands = useMemo(() => {
    if (resolvedActiveScale?.items && resolvedActiveScale.items.length > 0) {
      return resolvedActiveScale.items;
    }
    return [];
  }, [resolvedActiveScale]);

  // Group classes by class_level_id
  const classesByLevel = useMemo(() => {
    const map = new Map<number, typeof classes>();
    for (const cls of classes) {
      if (cls.class_level_id) {
        const list = map.get(cls.class_level_id) ?? [];
        list.push(cls);
        map.set(cls.class_level_id, list);
      }
    }
    return map;
  }, [classes]);

  // Total sections / arms computed across classes
  const totalSections = useMemo(() => {
    return classes.reduce((sum, cls) => sum + (cls.sections_count ?? 1), 0);
  }, [classes]);

  // Filtered subjects for preview
  const filteredSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return subjects.slice(0, 6);
    const q = subjectSearch.toLowerCase().trim();
    return subjects
      .filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
      .slice(0, 6);
  }, [subjects, subjectSearch]);

  // Current term progress calculation
  const termTimeline = useMemo(() => {
    if (!currentTerm?.start_date || !currentTerm?.end_date) return null;
    const start = new Date(currentTerm.start_date).getTime();
    const end = new Date(currentTerm.end_date).getTime();
    const now = new Date().getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));
    const percentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    return { totalDays, daysElapsed, percentage };
  }, [currentTerm?.start_date, currentTerm?.end_date]);

  // Institutional Readiness Checklist
  const academicChecks = [
    {
      label: "Active Academic Session Designated",
      description: currentSession?.name ? `Session ${currentSession.name}` : "No active session set",
      completed: Boolean(currentSession?.name),
      href: "/academics/sessions",
    },
    {
      label: "Current Academic Term in Progress",
      description: currentTerm?.name ? `Active: ${currentTerm.name}` : "No term marked active",
      completed: Boolean(currentTerm?.name),
      href: "/academics/sessions",
    },
    {
      label: "Class Hierarchy & Arms Configured",
      description: `${totalClasses} classes, ${totalSections} total arms`,
      completed: totalClasses > 0,
      href: "/academics/classes",
    },
    {
      label: "Accredited Curriculum Subjects Defined",
      description: `${totalSubjects} subjects registered`,
      completed: totalSubjects > 0,
      href: "/academics/subjects",
    },
    {
      label: "Evaluation Grading Scale Established",
      description:
        gradeBands.length > 0
          ? `${gradeBands.length} grade boundaries (${activeScale?.name || "Standard Scale"})`
          : "No grading scale configured",
      completed: gradeBands.length > 0,
      href: "/settings/grading",
    },
    {
      label: "Instructional Teaching Staff Allocated",
      description: `${totalTeachers} certified teachers on duty`,
      completed: totalTeachers > 0,
      href: "/staff",
    },
  ];
  const completedChecksCount = academicChecks.filter((c) => c.completed).length;

  const hasSyncError =
    sessionsQuery.isError ||
    classesQuery.isError ||
    subjectsQuery.isError ||
    teachersQuery.isError ||
    gradingQuery.isError;

  const handleRetrySync = () => {
    sessionsQuery.refetch();
    classesQuery.refetch();
    subjectsQuery.refetch();
    teachersQuery.refetch();
    gradingQuery.refetch();
    classLevelsQuery.refetch();
    contextQuery.refetch();
  };

  return (
    <div className="space-y-8">
      {/* Sync Error Advisory Banner */}
      {hasSyncError && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 px-4 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Some academic structure datasets could not be synchronized with the server.</span>
          </div>
          <button
            type="button"
            onClick={handleRetrySync}
            className="font-medium underline hover:text-amber-900 dark:hover:text-amber-100"
          >
            Retry sync
          </button>
        </div>
      )}

      {/* 1. HERO HEADER & QUICK MANAGEMENT ACTIONS */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Academic Framework & Operations</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Academic Overview
          </h1>
          <p className="text-sm text-muted-foreground">
            Orchestrate school calendar cycles, instructional levels, curriculum courses, and grading rules.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/academics/sessions"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Calendar className="mr-1.5 h-3.5 w-3.5" />
            Calendar & Terms
          </Link>
          <Link
            href="/academics/classes"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Class
          </Link>
          <Link
            href="/academics/subjects"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Register Subject
          </Link>
          <Link
            href="/settings/grading"
            className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
          >
            <Percent className="mr-1.5 h-3.5 w-3.5" />
            Grading Scales
          </Link>
        </div>
      </div>

      {/* 2. ACTIVE SESSION & TERM ENGINE BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Academic Session
              </span>
              {currentSession?.start_date && currentSession?.end_date && (
                <span className="text-xs font-medium text-muted-foreground">
                  • {currentSession.start_date} to {currentSession.end_date}
                </span>
              )}
            </div>

            {sessionsQuery.isPending ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>
            ) : currentSession ? (
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {currentSession.name} Academic Session
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {currentTerm ? (
                    <>
                      Currently in{" "}
                      <span className="font-semibold text-foreground">{currentTerm.name}</span>
                      {currentTerm.start_date && currentTerm.end_date ? (
                        <span>
                          {" "}
                          ({currentTerm.start_date} through {currentTerm.end_date})
                        </span>
                      ) : null}
                      . Examinations and student evaluations are benchmarked against this period.
                    </>
                  ) : (
                    "No specific academic term is currently flagged as active. Select a term to begin attendance and grading batches."
                  )}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  No Active Session Configured
                </h2>
                <p className="text-xs text-muted-foreground">
                  Set an active academic session to activate student grading, attendance rosters, and term records.
                </p>
              </div>
            )}
          </div>

          {/* Timeline and Setup Health */}
          <div className="flex flex-wrap items-center gap-4">
            {termTimeline && (
              <div className="rounded-xl border border-border/80 bg-background/80 p-3 backdrop-blur-sm sm:w-48">
                <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Term Progress</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {termTimeline.percentage}%
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${termTimeline.percentage}%` }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Day {termTimeline.daysElapsed} of {termTimeline.totalDays}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-center backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Readiness Audit
              </p>
              <p className="text-lg font-bold text-foreground">
                {completedChecksCount} / {academicChecks.length}
              </p>
            </div>

            <Link
              href="/academics/sessions"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Manage Calendar
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Term Sequence Mini Ribbon */}
        {terms.length > 0 && (
          <div className="mt-6 border-t border-border/50 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Session Terms Sequence ({terms.length} Terms)
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {terms.map((t) => (
                <div
                  key={t.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border p-3 text-xs transition-colors",
                    t.is_current
                      ? "border-emerald-500/40 bg-emerald-500/5 text-foreground font-medium"
                      : "border-border/60 bg-background/60 text-muted-foreground"
                  )}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">{t.name}</span>
                      {t.is_current && (
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.2 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {t.start_date && t.end_date ? `${t.start_date} → ${t.end_date}` : "Dates pending"}
                    </p>
                  </div>
                  <Clock className={cn("h-4 w-4", t.is_current ? "text-emerald-500" : "text-muted-foreground/40")} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. KEY ACADEMIC METRICS KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Classes & Arms */}
        <Link
          href="/academics/classes"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Classes & Arms
              </p>
              {classesQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalClasses}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 transition-colors group-hover:bg-emerald-600 group-hover:text-white dark:text-emerald-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{totalSections} arms allocated</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Structure
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Metric 2: Curriculum Breadth */}
        <Link
          href="/academics/subjects"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Accredited Curriculum
              </p>
              {subjectsQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalSubjects}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 transition-colors group-hover:bg-rose-600 group-hover:text-white dark:text-rose-400">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Subjects taught</span>
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                Accredited
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Metric 3: Teaching Faculty */}
        <Link
          href="/staff"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Teaching Faculty
              </p>
              {teachersQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalTeachers}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Instructional teachers</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Active
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Metric 4: Grading System */}
        <Link
          href="/settings/grading"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Grading Framework
              </p>
              {gradingQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {gradeBands.length > 0 ? `${gradeBands.length} Tiers` : `${gradingScales.length} Scales`}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:text-blue-400">
              <Percent className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Letter grade scale</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Defined
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      </div>

      {/* 4. FOUNDATIONAL ACADEMIC TIERS & CLASS ALLOCATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Academic Tiers & Class Allocations
            </h2>
            <p className="text-xs text-muted-foreground">
              Institutional breakdown across foundational educational levels
            </p>
          </div>
          <Link
            href="/academics/classes"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Manage all classes & arms
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {classLevelsQuery.isPending
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-4 w-14 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3.5 w-44" />
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-3">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-4 w-6" />
                  </div>
                </div>
              ))
            : classLevels.map((lvl) => {
                const levelClasses = classesByLevel.get(lvl.id) ?? [];
                const classCount = levelClasses.length || (lvl.classes_count ?? 0);
                const classPercent = totalClasses > 0 ? Math.round((classCount / totalClasses) * 100) : 0;

                return (
                  <div
                    key={lvl.id}
                    className="group relative flex flex-col justify-between rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                          {lvl.code}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          {lvl.status}
                        </span>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-foreground">{lvl.name}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lvl.code === "NUR" && "Early childhood foundational learning"}
                        {lvl.code === "PRI" && "Primary foundational educational cycle"}
                        {lvl.code === "JSS" && "Junior secondary basic curriculum"}
                        {lvl.code === "SSS" && "Senior secondary preparation & certificates"}
                        {!["NUR", "PRI", "JSS", "SSS"].includes(lvl.code) && "Specialized academic stage"}
                      </p>

                      {/* Class tags list preview */}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {levelClasses.length > 0 ? (
                          levelClasses.slice(0, 4).map((c) => (
                            <span
                              key={c.id}
                              className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {c.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">No classes yet</span>
                        )}
                        {levelClasses.length > 4 && (
                          <span className="text-[10px] text-muted-foreground font-medium pt-0.5">
                            +{levelClasses.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Tier Capacity</span>
                        <span className="font-semibold text-foreground">
                          {classCount} {classCount === 1 ? "class" : "classes"} ({classPercent}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/70">
                        <div
                          className="h-full rounded-full bg-primary/75 transition-all duration-500"
                          style={{ width: `${classPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* 5. DEEP OPERATIONAL SPLIT GRID (Curriculum Directory & Grading Framework) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Curriculum Directory Preview (7 cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Curriculum Subjects
              </h2>
              <p className="text-xs text-muted-foreground">
                Registered academic disciplines and coursework
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter subjects..."
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  className="h-8 w-44 rounded-lg border border-border/80 bg-background pl-8 pr-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Link
                href="/academics/subjects"
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                All Subjects
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            {subjectsQuery.isPending ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <div className="space-y-1.5">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredSubjects.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40 mb-2" />
                No subjects found matching your filter.
                <div className="mt-3">
                  <Link
                    href="/academics/subjects"
                    className={cn(buttonVariants({ size: "sm" }), "text-xs")}
                  >
                    Register New Subject
                  </Link>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {filteredSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground text-sm">{sub.name}</span>
                        <span className="font-mono text-xs font-semibold rounded bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {sub.code}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Standard curriculum coursework
                      </p>
                    </div>

                    <Link
                      href="/academics/subjects"
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      Configure
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Grading Framework & Audit Checklist (5 cols) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Active Grading Scale Breakdown */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Grading Scale Framework
                </h2>
                <p className="text-xs text-muted-foreground">
                  Score thresholds and GPA points standard
                </p>
              </div>
              <Link
                href="/settings/grading"
                className="text-xs font-medium text-primary hover:underline"
              >
                Edit Scale
              </Link>
            </div>

            {gradingQuery.isPending || (Boolean(activeScale?.id) && activeScaleDetailQuery.isPending) ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))}
              </div>
            ) : gradeBands.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-4 text-center">
                <p className="text-xs text-muted-foreground">
                  No grading scale defined yet.
                </p>
                <Link
                  href="/settings/grading"
                  className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Create standard grading scale
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border/70">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border/70 bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="py-2 px-3 font-semibold">Grade</th>
                      <th className="py-2 px-3 font-semibold">Score Range</th>
                      <th className="py-2 px-3 font-semibold">GPA</th>
                      <th className="py-2 px-3 font-semibold text-right">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {gradeBands.map((item, idx) => {
                      const minVal = Number(item.min_percentage ?? item.min_score ?? 0);
                      const maxVal = Number(item.max_percentage ?? item.max_score ?? 100);
                      return (
                        <tr key={item.id ?? idx} className="hover:bg-muted/30">
                          <td className="py-2 px-3 font-bold text-foreground font-mono">
                            {item.grade}
                          </td>
                          <td className="py-2 px-3 text-muted-foreground">
                            {minVal}% – {maxVal}%
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-foreground">
                            {Number(item.grade_point).toFixed(1)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                                minVal >= 70
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : minVal >= 50
                                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                  : "bg-destructive/10 text-destructive"
                              )}
                            >
                              {item.remark || "Standard"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Academic Readiness Audit Checklist */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Academic Operations Health
                </h2>
                <p className="text-xs text-muted-foreground">
                  Compliance and structural configuration checklist
                </p>
              </div>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>

            <ul className="space-y-3">
              {academicChecks.map((check) => (
                <li key={check.label} className="flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    {check.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={check.completed ? "font-medium text-foreground" : "text-muted-foreground"}>
                        {check.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{check.description}</p>
                    </div>
                  </div>
                  {!check.completed && (
                    <Link
                      href={check.href}
                      className="text-[11px] font-medium text-primary hover:underline shrink-0"
                    >
                      Fix
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AcademicOverviewPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <AdminOnly
        check={canManageStaff}
        description="The academic overview is available to school administrators and academic directors."
      >
        <AcademicOverviewContent />
      </AdminOnly>
    </main>
  );
}

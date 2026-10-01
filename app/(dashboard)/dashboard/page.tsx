"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  GraduationCap,
  Layers,
  Percent,
  Plus,
  School as SchoolIcon,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import {
  useAcademicContext,
  useClasses,
  useClassLevels,
  useGradingScales,
  useSubjects,
} from "@/lib/academics/queries";
import { useStudentList } from "@/lib/students/queries";
import { useAdmissionList } from "@/lib/admissions/queries";
import { useStaffList } from "@/lib/staff/queries";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Queries for live metrics
  const contextQuery = useAcademicContext();
  const classLevelsQuery = useClassLevels();
  const classesQuery = useClasses(1);
  const studentsQuery = useStudentList({ page: 1 });
  const admissionsQuery = useAdmissionList({ page: 1 });
  const staffQuery = useStaffList({ page: 1 });
  const subjectsQuery = useSubjects(1);
  const gradingQuery = useGradingScales();

  const context = contextQuery.data;
  const session = context?.session;
  const term = context?.term;
  const school = context?.school;

  const totalStudents = studentsQuery.data?.meta.total ?? 0;
  const totalClasses = classesQuery.data?.meta.total ?? 0;
  const totalStaff = staffQuery.data?.meta.total ?? 0;
  const totalAdmissions = admissionsQuery.data?.meta.total ?? 0;
  const totalSubjects = subjectsQuery.data?.meta.total ?? 0;
  const classLevels = classLevelsQuery.data?.data ?? [];
  const classes = classesQuery.data?.data ?? [];
  const recentAdmissions = admissionsQuery.data?.data?.slice(0, 5) ?? [];

  const pendingAdmissions = useMemo(() => {
    return (admissionsQuery.data?.data ?? []).filter((a) => a.status === "pending").length;
  }, [admissionsQuery.data?.data]);

  // Compute classes count per level
  const classesPerLevel = useMemo(() => {
    const map = new Map<number, number>();
    for (const cls of classes) {
      if (cls.class_level_id) {
        map.set(cls.class_level_id, (map.get(cls.class_level_id) ?? 0) + 1);
      }
    }
    return map;
  }, [classes]);

  // Calculate term progress percentage and timeline
  const termProgress = useMemo(() => {
    if (!term?.start_date || !term?.end_date) return null;
    const start = new Date(term.start_date).getTime();
    const end = new Date(term.end_date).getTime();
    const now = new Date().getTime();
    if (isNaN(start) || isNaN(end) || end <= start) return null;
    const totalDays = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.min(totalDays, Math.round((now - start) / (1000 * 60 * 60 * 24))));
    const percentage = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDays) * 100)));
    return { totalDays, daysElapsed, percentage };
  }, [term?.start_date, term?.end_date]);

  const hasSyncError =
    contextQuery.isError ||
    classLevelsQuery.isError ||
    classesQuery.isError ||
    studentsQuery.isError ||
    admissionsQuery.isError ||
    staffQuery.isError;

  const handleRetrySync = () => {
    contextQuery.refetch();
    classLevelsQuery.refetch();
    classesQuery.refetch();
    studentsQuery.refetch();
    admissionsQuery.refetch();
    staffQuery.refetch();
    subjectsQuery.refetch();
    gradingQuery.refetch();
  };

  const greeting = getGreeting();
  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const setupChecks = [
    { label: "School Profile Configured", completed: Boolean(school?.name) },
    { label: "Active Academic Session", completed: Boolean(session?.name) },
    { label: "Current Term in Progress", completed: Boolean(term?.name) },
    { label: "Grading Scale Defined", completed: (gradingQuery.data?.length ?? 0) > 0 },
  ];
  const completedChecksCount = setupChecks.filter((c) => c.completed).length;

  return (
    <main className="flex-1 space-y-8 px-6 py-8 md:px-8">
      {/* Sync Error Advisory Banner */}
      {hasSyncError && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 px-4 text-xs text-amber-700 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Some real-time metrics could not be synchronized with the server.</span>
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

      {/* 1. HERO & QUICK ACTIONS */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span suppressHydrationWarning>{todayFormatted}</span>
          </div>
          <h1
            suppressHydrationWarning
            className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            {greeting}, {user?.name?.split(" ")[0] || "Administrator"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here is what&apos;s happening across your school today.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admissions"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Admission
          </Link>
          <Link
            href="/academics/classes"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Create Class
          </Link>
          <Link
            href="/students"
            className={cn(buttonVariants({ size: "sm" }), "shadow-sm")}
          >
            <GraduationCap className="mr-1.5 h-4 w-4" />
            Enroll Student
          </Link>
        </div>
      </div>

      {/* 2. LIVE ACADEMIC CONTEXT BANNER */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Academic Period
              </span>
              {contextQuery.isPending ? (
                <Skeleton className="h-4 w-32" />
              ) : school?.name ? (
                <span className="text-xs font-medium text-muted-foreground">
                  • {school.name}
                </span>
              ) : null}
            </div>
            {contextQuery.isPending ? (
              <div className="space-y-2 py-1">
                <Skeleton className="h-7 w-64" />
                <Skeleton className="h-4 w-80 max-w-full" />
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {session?.name ? `${session.name} Session` : "Academic Session Pending"}
                  {term?.name && ` — ${term.name}`}
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {term?.start_date && term?.end_date ? (
                    <>
                      Term duration:{" "}
                      <span className="font-medium text-foreground">
                        {term.start_date} to {term.end_date}
                      </span>
                    </>
                  ) : (
                    "Configure your academic sessions and terms to activate full reporting and attendance."
                  )}
                </p>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="rounded-xl border border-border/80 bg-background/80 p-3 text-center backdrop-blur-sm">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Setup Progress
              </p>
              {contextQuery.isPending || gradingQuery.isPending ? (
                <Skeleton className="mx-auto mt-1 h-6 w-12" />
              ) : (
                <p className="text-lg font-bold text-foreground">
                  {completedChecksCount} / {setupChecks.length}
                </p>
              )}
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
      </div>

      {/* 3. KEY METRICS KPI GRID */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Card 1: Students */}
        <Link
          href="/students"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Total Students
              </p>
              {studentsQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalStudents}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white dark:text-blue-400">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Enrolled learners</span>
              <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Active
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Card 2: Classes */}
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
              <span>Across 4 tiers</span>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Live
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Card 3: Staff */}
        <Link
          href="/staff"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Faculty & Staff
              </p>
              {staffQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalStaff}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white dark:text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>Teachers & admin</span>
              <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                Assigned
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Card 4: Admissions */}
        <Link
          href="/admissions"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Admissions
              </p>
              {admissionsQuery.isPending ? (
                <Skeleton className="mt-2 h-8 w-16" />
              ) : (
                <h3 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
                  {totalAdmissions}
                </h3>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 transition-colors group-hover:bg-amber-600 group-hover:text-white dark:text-amber-400">
              <ClipboardList className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3 text-xs text-muted-foreground">
            {admissionsQuery.isPending ? (
              <Skeleton className="h-3.5 w-24" />
            ) : (
              <div className="flex items-center gap-2">
                <span>{pendingAdmissions} pending</span>
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                  Intake
                </span>
              </div>
            )}
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        {/* Card 5: Subjects */}
        <Link
          href="/academics/subjects"
          className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Curriculum
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
              <span>Curriculum courses</span>
              <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                Accredited
              </span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      </div>

      {/* 4. ACADEMIC LEVELS BREAKDOWN */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Academic Levels Distribution
            </h2>
            <p className="text-xs text-muted-foreground">
              Overview of foundational stages and class allocations
            </p>
          </div>
          <Link
            href="/academics/classes"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Manage all classes
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
                const classCount = classesPerLevel.get(lvl.id) ?? (lvl.classes_count ?? 0);
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
                        {lvl.code === "NUR" && "Early childhood education"}
                        {lvl.code === "PRI" && "Primary foundational education"}
                        {lvl.code === "JSS" && "Junior secondary education"}
                        {lvl.code === "SSS" && "Senior secondary preparation"}
                        {!["NUR", "PRI", "JSS", "SSS"].includes(lvl.code) && "Academic level tier"}
                      </p>
                    </div>

                    <div className="mt-6 space-y-2 border-t border-border/50 pt-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Class Allocation</span>
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

      {/* 5. OPERATIONAL SPLIT GRID */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Admissions Activity (2/3 width) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Recent Admissions Intake
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest student applicant submissions and review status
              </p>
            </div>
            <Link
              href="/admissions"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              View Pipeline
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
            {admissionsQuery.isPending ? (
              <div className="divide-y divide-border/60 p-4 space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentAdmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <ClipboardList className="h-6 w-6" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">No recent applications</h3>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  Incoming student applications will appear here as they are submitted.
                </p>
                <Link
                  href="/admissions"
                  className={cn(buttonVariants({ size: "sm" }), "mt-4")}
                >
                  Create Application
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {recentAdmissions.map((adm) => {
                  const statusColors = {
                    pending: "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                    approved: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                    rejected: "border-destructive/20 bg-destructive/10 text-destructive",
                  };

                  return (
                    <div
                      key={adm.id}
                      className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{adm.applicant_name}</span>
                          <span className="font-mono text-xs text-muted-foreground">
                            ({adm.admission_no})
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Applied for:{" "}
                          <span className="font-medium text-foreground">
                            {adm.intended_class?.name || "General"}
                          </span>{" "}
                          • Submitted on {adm.application_date}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider",
                            statusColors[adm.status] || "bg-muted text-muted-foreground"
                          )}
                        >
                          {adm.status}
                        </span>
                        <Link
                          href={`/admissions`}
                          className={buttonVariants({ variant: "ghost", size: "sm" })}
                        >
                          Review
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Setup Health & Quick Shortcuts (1/3 width) */}
        <div className="space-y-6">
          {/* Setup Checklist */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                System Readiness Checklist
              </h2>
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Core academic foundational configuration
            </p>

            <ul className="mt-4 space-y-3">
              {contextQuery.isPending || gradingQuery.isPending
                ? Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                      <Skeleton className="h-3.5 w-40" />
                    </li>
                  ))
                : setupChecks.map((check) => (
                    <li key={check.label} className="flex items-center gap-2.5 text-xs">
                      {check.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className={check.completed ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {check.label}
                      </span>
                    </li>
                  ))}
            </ul>
          </div>

          {/* Term Timeline & Progress Widget */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Term Timeline & Progress
              </h2>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {term?.name || "Academic Term"} session schedule
            </p>

            {contextQuery.isPending ? (
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3.5 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-3 w-40" />
              </div>
            ) : termProgress ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Day {termProgress.daysElapsed} of {termProgress.totalDays}
                  </span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {termProgress.percentage}% elapsed
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${termProgress.percentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Start: {term?.start_date}</span>
                  <span>End: {term?.end_date}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-border/70 p-3 text-center">
                <p className="text-xs text-muted-foreground">
                  Term schedule dates not yet specified.
                </p>
                <Link
                  href="/academics/sessions"
                  className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  Configure schedule
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Quick Hub Links */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Quick Shortcuts</h2>
            <p className="mt-1 text-xs text-muted-foreground">Frequently accessed administrative modules</p>

            <div className="mt-4 space-y-2">
              <Link
                href="/academics/classes"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/70"
              >
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <span>Class & Section Management</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/staff"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/70"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Staff & Teacher Allocation</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/results"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/70"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span>Examination Results & Batches</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>

              <Link
                href="/settings/grading"
                className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-2.5 text-xs font-medium text-foreground transition-all hover:bg-muted/70"
              >
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span>Grading Scale Setup</span>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { buttonVariants } from "@/components/ui/button";
import { canManageStaff } from "@/lib/auth/permissions";
import { useAcademicSessions, useClasses, useSubjects, useTerms } from "@/lib/academics/queries";
import { useStaffList } from "@/lib/staff/queries";

function AcademicOverviewContent() {
  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const subjectsQuery = useSubjects(1);
  const teachersQuery = useStaffList({ is_teacher: true, status: "active", page: 1 });

  const currentSession = sessionsQuery.data?.data.find((s) => s.is_current) ?? null;
  const termsQuery = useTerms(currentSession?.id ?? 0);
  const currentTerm = termsQuery.data?.find((t) => t.is_current) ?? null;

  const anyPending =
    sessionsQuery.isPending || classesQuery.isPending || subjectsQuery.isPending || teachersQuery.isPending;
  const firstError =
    sessionsQuery.error ?? classesQuery.error ?? subjectsQuery.error ?? teachersQuery.error ?? null;

  if (anyPending) return <LoadingState label="Loading academic overview…" />;
  if (firstError) return <ErrorState error={firstError} />;

  return (
    <div className="space-y-8">
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="text-sm font-medium text-muted-foreground">Current academic period</h2>
        {currentSession ? (
          <p className="mt-1 text-base">
            <span className="font-medium">{currentSession.name}</span>
            {termsQuery.isPending ? null : currentTerm ? (
              <span className="text-muted-foreground"> — {currentTerm.name}</span>
            ) : (
              <span className="text-muted-foreground"> — no current term set</span>
            )}
          </p>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">
            No academic session is currently marked active.{" "}
            <Link href="/academics/sessions" className="underline">
              Set one
            </Link>
            .
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Academic structure</h2>
        <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-3">
          {[
            { label: "Classes", value: classesQuery.data?.meta.total, href: "/academics/classes" },
            { label: "Subjects", value: subjectsQuery.data?.meta.total, href: "/academics/subjects" },
            { label: "Teaching staff", value: teachersQuery.data?.meta.total, href: "/staff" },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="bg-card px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="text-xl font-semibold">{stat.value ?? "—"}</dd>
            </Link>
          ))}
        </dl>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Manage</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/academics/sessions" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Academic Sessions
          </Link>
          <Link href="/academics/classes" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Classes
          </Link>
          <Link href="/academics/subjects" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Subjects
          </Link>
          <Link href="/settings/grading" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Grading
          </Link>
          <Link href="/staff" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Staff
          </Link>
        </div>
      </section>
    </div>
  );
}

export default function AcademicOverviewPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Academic Overview</h1>
        <p className="text-sm text-muted-foreground">
          A snapshot of the school&apos;s current academic structure.
        </p>
      </div>
      <AdminOnly check={canManageStaff} description="The academic overview is available to school administrators and registrars.">
        <AcademicOverviewContent />
      </AdminOnly>
    </main>
  );
}

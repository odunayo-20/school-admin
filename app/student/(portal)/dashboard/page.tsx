"use client";

import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useStudentAuth } from "@/lib/student-portal/auth-context";
import { useCurrentEnrollment, useReportCardHistory } from "@/lib/student-portal/queries";

function statusBadge(status: string) {
  if (status === "ACTIVE") return <Badge>Active</Badge>;
  return <Badge variant="outline">{status}</Badge>;
}

export default function StudentDashboardPage() {
  const { user } = useStudentAuth();
  const enrollmentQuery = useCurrentEnrollment();
  const historyQuery = useReportCardHistory(1);

  const latestResult = historyQuery.data?.data[0];

  return (
    <main className="flex-1 space-y-8 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">
          Welcome, {user?.student?.full_name ?? user?.name}
        </h1>
        {user?.student && <p className="text-sm text-muted-foreground">Student ID: {user.student.student_number}</p>}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Where you are academically</h2>
        {enrollmentQuery.isPending && <LoadingState label="Loading your enrollment…" />}
        {enrollmentQuery.isError && (
          <ErrorState error={enrollmentQuery.error} onRetry={() => enrollmentQuery.refetch()} />
        )}
        {enrollmentQuery.isSuccess && !enrollmentQuery.data && (
          <EmptyState
            title="No active enrollment for the current academic session."
            description="Contact your school's office if you believe this is incorrect."
          />
        )}
        {enrollmentQuery.isSuccess && enrollmentQuery.data && (
          <div className="rounded-md border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium">
                {enrollmentQuery.data.school_class.name}
                {enrollmentQuery.data.section ? ` - ${enrollmentQuery.data.section.name}` : ""}
              </p>
              {statusBadge(enrollmentQuery.data.status)}
            </div>
            <p className="text-sm text-muted-foreground">{enrollmentQuery.data.academic_session.name}</p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Latest result</h2>
          <Link href="/student/results" className="text-sm text-muted-foreground hover:text-foreground">
            View all →
          </Link>
        </div>
        {historyQuery.isPending && <LoadingState label="Loading results…" />}
        {historyQuery.isError && <ErrorState error={historyQuery.error} onRetry={() => historyQuery.refetch()} />}
        {historyQuery.isSuccess && !latestResult && (
          <EmptyState title="No published result is available yet." />
        )}
        {latestResult && (
          <Link
            href={`/student/results/${latestResult.enrollment.id}/${latestResult.term.id}`}
            className="block rounded-md border border-border bg-card p-4 hover:bg-muted/40"
          >
            <p className="font-medium">
              {latestResult.term.name} — {latestResult.term.academic_session.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {latestResult.subjects_count} subject{latestResult.subjects_count === 1 ? "" : "s"} · Overall{" "}
              {latestResult.overall_percentage}%
            </p>
          </Link>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Quick links</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/student/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Profile
          </Link>
          <Link href="/student/academics" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Academics
          </Link>
          <Link href="/student/results" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Results
          </Link>
          <Link href="/student/settings" className={buttonVariants({ variant: "outline", size: "sm" })}>
            Settings
          </Link>
        </div>
      </section>
    </main>
  );
}

"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { useCurrentEnrollment } from "@/lib/student-portal/queries";

export default function StudentAcademicsPage() {
  const enrollmentQuery = useCurrentEnrollment();
  const enrollment = enrollmentQuery.data;

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <h1 className="text-lg font-semibold">Academics</h1>

      {enrollmentQuery.isPending && <LoadingState label="Loading your academic record…" />}
      {enrollmentQuery.isError && <ErrorState error={enrollmentQuery.error} onRetry={() => enrollmentQuery.refetch()} />}
      {enrollmentQuery.isSuccess && !enrollment && (
        <EmptyState
          title="No active enrollment for the current academic session."
          description="Contact your school's office if you believe this is incorrect."
        />
      )}

      {enrollment && (
        <dl className="max-w-md space-y-1 text-sm">
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Academic session</dt>
            <dd className="font-medium">{enrollment.academic_session.name}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Class</dt>
            <dd className="font-medium">{enrollment.school_class.name}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Section</dt>
            <dd className="font-medium">{enrollment.section?.name ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Enrollment date</dt>
            <dd>{enrollment.enrollment_date}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Status</dt>
            <dd>
              {enrollment.status === "ACTIVE" ? <Badge>Active</Badge> : <Badge variant="outline">{enrollment.status}</Badge>}
            </dd>
          </div>
        </dl>
      )}

      {enrollment && (
        <p className="max-w-md text-sm text-muted-foreground">
          A subject list isn&apos;t available in the portal yet — check with your school&apos;s
          office for your current subject offering.
        </p>
      )}
    </main>
  );
}

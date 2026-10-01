"use client";

import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { useStudentAuth } from "@/lib/student-portal/auth-context";
import { useCurrentEnrollment } from "@/lib/student-portal/queries";

/**
 * There is no dedicated profile endpoint on the backend yet — `profile.view`/
 * `profile.update` permissions are seeded to every role, but no controller
 * uses them (see the Module 09 report). The fullest student record
 * available to a student is the `student` object nested inside their own
 * enrollment, so that is the source here. Without a current enrollment,
 * only the minimal identity `/auth/me` carries (name, student number) can
 * be shown — never invented.
 */
export default function StudentProfilePage() {
  const { user } = useStudentAuth();
  const enrollmentQuery = useCurrentEnrollment();
  const student = enrollmentQuery.data?.student;

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <h1 className="text-lg font-semibold">Profile</h1>

      {enrollmentQuery.isPending && <LoadingState label="Loading your profile…" />}
      {enrollmentQuery.isError && <ErrorState error={enrollmentQuery.error} onRetry={() => enrollmentQuery.refetch()} />}

      {enrollmentQuery.isSuccess && !student && (
        <div className="space-y-4">
          <EmptyState
            title="Full profile details are unavailable right now."
            description="Only your name and student ID are shown until you have an active enrollment on record."
          />
          <dl className="max-w-md space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Full name</dt>
              <dd>{user?.student?.full_name ?? user?.name}</dd>
            </div>
            {user?.student && (
              <div className="flex justify-between border-b border-border py-1.5">
                <dt className="text-muted-foreground">Student ID</dt>
                <dd>{user.student.student_number}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {student && (
        <dl className="max-w-md space-y-1 text-sm">
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Full name</dt>
            <dd className="font-medium">{student.full_name}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Student ID</dt>
            <dd>{student.student_number}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Date of birth</dt>
            <dd>{student.date_of_birth ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Gender</dt>
            <dd className="capitalize">{student.gender?.toLowerCase() ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{student.status === "ACTIVE" ? <Badge>Active</Badge> : <Badge variant="outline">{student.status}</Badge>}</dd>
          </div>
        </dl>
      )}

      <p className="max-w-md text-sm text-muted-foreground">
        To correct any of these details, contact your school&apos;s office — profile editing
        isn&apos;t available in the portal yet.
      </p>
    </main>
  );
}

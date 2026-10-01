"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LoadingState, ErrorState } from "@/components/data-state";
import { useStaffAuth } from "@/lib/staff-portal/auth-context";
import { useAcademicSessions, useMyAssignments } from "@/lib/staff-portal/queries";

export default function StaffDashboardPage() {
  const { user } = useStaffAuth();
  const isTeaching = user?.staff_type === "TEACHING";
  const sessionsQuery = useAcademicSessions();
  const assignmentsQuery = useMyAssignments("ACTIVE", 1);

  const currentSession = sessionsQuery.data?.find((s) => s.is_current) ?? null;

  return (
    <main className="flex-1 space-y-8 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Welcome, {user?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {user?.staff_type === "TEACHING" ? "Teaching staff" : "Non-teaching staff"}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground">Current academic session</h2>
        {sessionsQuery.isPending && <LoadingState label="Loading…" />}
        {sessionsQuery.isError && <ErrorState error={sessionsQuery.error} onRetry={() => sessionsQuery.refetch()} />}
        {sessionsQuery.isSuccess && (
          <p className="text-sm">
            {currentSession ? (
              <>
                <span className="font-medium">{currentSession.name}</span>{" "}
                <Badge variant="outline">{currentSession.status}</Badge>
              </>
            ) : (
              <span className="text-muted-foreground">No academic session is currently active.</span>
            )}
          </p>
        )}
      </section>

      {isTeaching && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">My teaching</h2>
            <Link href="/staff-portal/assignments" className="text-sm font-medium text-primary hover:underline">
              View all →
            </Link>
          </div>
          {assignmentsQuery.isPending && <LoadingState label="Loading your assignments…" />}
          {assignmentsQuery.isError && (
            <ErrorState error={assignmentsQuery.error} onRetry={() => assignmentsQuery.refetch()} />
          )}
          {assignmentsQuery.isSuccess && (
            <p className="text-sm">
              {assignmentsQuery.data.meta.total === 0 ? (
                <span className="text-muted-foreground">You have no active teaching assignments right now.</span>
              ) : (
                <>
                  You are actively teaching{" "}
                  <span className="font-medium">
                    {assignmentsQuery.data.meta.total} class subject{assignmentsQuery.data.meta.total === 1 ? "" : "s"}
                  </span>
                  .
                </>
              )}
            </p>
          )}
        </section>
      )}

      {!isTeaching && (
        <section>
          <p className="max-w-md text-sm text-muted-foreground">
            You are registered as non-teaching staff. Teaching assignments, scores and results
            are not applicable to your account.
          </p>
        </section>
      )}
    </main>
  );
}

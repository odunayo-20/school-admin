"use client";

import { Suspense, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { ResultsPanel } from "@/components/staff-portal/results-panel";
import { ScoresPanel } from "@/components/staff-portal/scores-panel";
import { useMyAssignments, useTerms } from "@/lib/staff-portal/queries";

function ClassSubjectWorkspace() {
  const params = useParams<{ classSubjectId: string }>();
  const searchParams = useSearchParams();
  const classSubjectId = Number(params.classSubjectId);
  const academicSessionId = Number(searchParams.get("session"));

  // Found only among the caller's OWN assignments (/teacher-assignments/me)
  // — never fetched by id directly, since the generic show endpoint is not
  // reachable by STAFF at all. A class_subject_id/session that doesn't
  // match one of the teacher's own ACTIVE assignments resolves to nothing
  // here, and every data call below is independently scoped server-side
  // regardless of what this page does.
  const assignmentsQuery = useMyAssignments("ACTIVE", 1, 100);
  const assignment = assignmentsQuery.data?.data.find(
    (a) => a.class_subject.id === classSubjectId && a.academic_session.id === academicSessionId
  );

  const termsQuery = useTerms(academicSessionId);
  const [termId, setTermId] = useState<number | null>(null);
  const terms = termsQuery.data ?? [];
  const selectedTermId = termId ?? terms.find((t) => t.is_current)?.id ?? terms[0]?.id ?? null;

  if (assignmentsQuery.isPending || termsQuery.isPending) {
    return <LoadingState label="Loading…" />;
  }

  if (assignmentsQuery.isError) {
    return <ErrorState error={assignmentsQuery.error} onRetry={() => assignmentsQuery.refetch()} />;
  }

  if (!assignment) {
    return (
      <EmptyState
        title="You are not assigned to this class subject."
        description="This may be an ended assignment, or a link that doesn't belong to you. Only your own active teaching assignments are shown here."
        action={
          <Link href="/staff-portal/assignments" className="text-sm font-medium text-primary hover:underline">
            ← Back to my teaching
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/staff-portal/assignments" className="text-sm text-muted-foreground hover:underline">
            ← My teaching
          </Link>
          <h1 className="mt-1 text-lg font-semibold">
            {assignment.class_subject.school_class.name} — {assignment.class_subject.subject.name}
          </h1>
          <p className="text-sm text-muted-foreground">{assignment.academic_session.name}</p>
        </div>

        {terms.length > 0 && (
          <div className="space-y-1">
            <label htmlFor="term-select" className="text-xs font-medium text-muted-foreground">
              Term
            </label>
            <Select
              id="term-select"
              className="w-48"
              value={selectedTermId ?? ""}
              onChange={(e) => setTermId(Number(e.target.value))}
            >
              {terms.map((term) => (
                <option key={term.id} value={term.id}>
                  {term.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {terms.length === 0 && (
        <EmptyState title="No terms configured for this academic session." />
      )}

      {selectedTermId && (
        <>
          <ResultsPanel classSubjectId={classSubjectId} termId={selectedTermId} />
          <ScoresPanel classSubjectId={classSubjectId} termId={selectedTermId} />
        </>
      )}
    </div>
  );
}

export default function ClassSubjectWorkspacePage() {
  return (
    <main className="flex-1 px-6 py-8">
      {/* Reads ?session= via useSearchParams(), which requires a Suspense
          boundary in the App Router. */}
      <Suspense>
        <ClassSubjectWorkspace />
      </Suspense>
    </main>
  );
}

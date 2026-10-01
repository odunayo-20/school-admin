"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCompileClassResults, useResults, useSubmitResult } from "@/lib/staff-portal/queries";
import { ApiError } from "@/lib/api/errors";
import type { ResultStatus } from "@/lib/staff-portal/types";
import { useState } from "react";

const STATUS_VARIANT: Record<ResultStatus, "default" | "outline"> = {
  INCOMPLETE: "outline",
  COMPILED: "outline",
  SUBMITTED: "default",
  APPROVED: "default",
  PUBLISHED: "default",
  LOCKED: "default",
};

/**
 * Compiling is the ONLY backend-sanctioned way a teacher discovers their
 * class's roster at all — see the Module 10 report. POST /results/bulk
 * computes (or recomputes) a Result for every currently ACTIVE enrollment
 * in the class, independently per student (one student having no scores
 * yet is INCOMPLETE, not an error), and each row carries the enrollment and
 * its student — which is also what the Scores panel's "record a score for
 * a new student" picker is built from.
 */
export function ResultsPanel({ classSubjectId, termId }: { classSubjectId: number; termId: number }) {
  const resultsQuery = useResults(classSubjectId, termId);
  const compile = useCompileClassResults(classSubjectId, termId);
  const submit = useSubmitResult(classSubjectId, termId);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(resultId: number) {
    setSubmitError(null);
    try {
      await submit.mutateAsync(resultId);
    } catch (error) {
      setSubmitError(error instanceof ApiError ? error.message : "Could not submit this result.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Results</h2>
        <Button size="sm" variant="outline" disabled={compile.isPending} onClick={() => compile.mutate()}>
          {compile.isPending ? "Compiling…" : "Compile / refresh results"}
        </Button>
      </div>

      {compile.isError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {compile.error instanceof ApiError ? compile.error.message : "Could not compile results."}
        </p>
      )}
      {submitError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </p>
      )}

      {resultsQuery.isPending && <LoadingState label="Loading results…" />}
      {resultsQuery.isError && <ErrorState error={resultsQuery.error} onRetry={() => resultsQuery.refetch()} />}

      {resultsQuery.isSuccess && resultsQuery.data.length === 0 && (
        <EmptyState
          title="No results compiled yet."
          description="Compile this class subject's results for the term to see each student's standing."
        />
      )}

      {resultsQuery.isSuccess && resultsQuery.data.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {resultsQuery.data.map((result) => (
              <TableRow key={result.id}>
                <TableCell className="font-medium">{result.enrollment.student.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{result.enrollment.student.student_number}</TableCell>
                <TableCell>{result.percentage ?? "—"}</TableCell>
                <TableCell>{result.grade ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[result.status]}>{result.status}</Badge>
                </TableCell>
                <TableCell>
                  {result.status === "COMPILED" && (
                    <Button size="sm" variant="outline" disabled={submit.isPending} onClick={() => handleSubmit(result.id)}>
                      Submit
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  );
}

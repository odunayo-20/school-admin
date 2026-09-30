"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VerifiedResult } from "@/lib/result-checker/types";

/**
 * Renders exactly what the verify response contains — no score, total, or
 * average is computed here. The real backend returns no `school` object on
 * this endpoint (confirmed live) and there is no public `GET /school`
 * either, so the document header is a static page title rather than a
 * fetched school name/address — see the Module 08 report for that gap.
 *
 * `onCheckAnother` is expected to drop this result from state entirely
 * (never just hide it), since it must not linger in memory longer than the
 * viewer is actively looking at it.
 */
export function ResultDocument({ result, onCheckAnother }: { result: VerifiedResult; onCheckAnother: () => void }) {
  const { enrollment, term, subjects, summary } = result;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <p className="text-sm text-muted-foreground">Verified result</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden="true" />
            Print
          </Button>
          <Button variant="outline" size="sm" onClick={onCheckAnother}>
            Check another result
          </Button>
        </div>
      </div>

      <div className="space-y-6 rounded-lg border border-border bg-card p-6 print:border-none print:p-0 print:shadow-none">
        <header className="space-y-1 border-b border-border pb-4 text-center">
          <h1 className="text-lg font-semibold">Student Result</h1>
          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {enrollment.academic_session.name} — {term.name}
          </p>
        </header>

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b border-border py-1.5 sm:border-none sm:py-0">
            <dt className="text-muted-foreground">Student name</dt>
            <dd className="font-medium">{enrollment.student.full_name}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5 sm:border-none sm:py-0">
            <dt className="text-muted-foreground">Student ID</dt>
            <dd className="font-medium">{enrollment.student.student_number}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5 sm:border-none sm:py-0">
            <dt className="text-muted-foreground">Class</dt>
            <dd className="font-medium">
              {enrollment.school_class.name}
              {enrollment.section ? ` - ${enrollment.section.name}` : ""}
            </dd>
          </div>
        </dl>

        <div>
          <h2 className="mb-2 text-sm font-medium text-muted-foreground">Subjects</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => (
                <TableRow key={subject.result_id}>
                  <TableCell className="font-medium">{subject.class_subject.subject.name}</TableCell>
                  <TableCell>{subject.percentage}%</TableCell>
                  <TableCell>{subject.grade ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{subject.remark ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subjects</dt>
            <dd className="font-medium">{summary.subjects_count}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Overall percentage</dt>
            <dd className="font-medium">{summary.overall_percentage}%</dd>
          </div>
          {summary.average_grade_point && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Average grade point</dt>
              <dd className="font-medium">{summary.average_grade_point}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}

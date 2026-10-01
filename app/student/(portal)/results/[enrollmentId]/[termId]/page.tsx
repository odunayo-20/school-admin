"use client";

import { use } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReportCard } from "@/lib/student-portal/queries";

export default function StudentResultDetailPage({
  params,
}: {
  params: Promise<{ enrollmentId: string; termId: string }>;
}) {
  const { enrollmentId, termId } = use(params);
  const reportCardQuery = useReportCard(Number(enrollmentId), Number(termId));

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/student/results" className="text-sm text-muted-foreground hover:text-foreground print:hidden">
        ← Back to results
      </Link>

      {reportCardQuery.isPending && <LoadingState label="Loading result…" />}
      {reportCardQuery.isError && (
        <ErrorState error={reportCardQuery.error} onRetry={() => reportCardQuery.refetch()} />
      )}

      {reportCardQuery.isSuccess && (() => {
        const card = reportCardQuery.data;
        if (card.subjects.length === 0) {
          return <EmptyState title="No published result is available for this term." />;
        }

        return (
          <div className="space-y-6 rounded-lg border border-border bg-card p-6 print:border-none print:p-0 print:shadow-none">
            <div className="flex items-start justify-between gap-3 print:hidden">
              <div>
                <h1 className="text-lg font-semibold">
                  {card.term.name} — {card.term.academic_session.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {card.enrollment.school_class.name}
                  {card.enrollment.section ? ` - ${card.enrollment.section.name}` : ""}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden="true" />
                Print
              </Button>
            </div>

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
                {card.subjects.map((subject) => (
                  <TableRow key={subject.result_id}>
                    <TableCell className="font-medium">{subject.class_subject.subject.name}</TableCell>
                    <TableCell>{subject.percentage}%</TableCell>
                    <TableCell>{subject.grade ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{subject.remark ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <dl className="grid gap-x-6 gap-y-2 border-t border-border pt-4 text-sm sm:grid-cols-2">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subjects</dt>
                <dd className="font-medium">{card.summary.subjects_count}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Overall percentage</dt>
                <dd className="font-medium">{card.summary.overall_percentage}%</dd>
              </div>
              {card.summary.average_grade_point && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Average grade point</dt>
                  <dd className="font-medium">{card.summary.average_grade_point}</dd>
                </div>
              )}
            </dl>
          </div>
        );
      })()}
    </main>
  );
}

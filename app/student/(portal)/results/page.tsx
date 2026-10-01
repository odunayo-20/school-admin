"use client";

import { useState } from "react";
import Link from "next/link";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { PaginationControls } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useReportCardHistory } from "@/lib/student-portal/queries";

/**
 * The backend's own report-card history endpoint accepts no session/term
 * filter (page-only, "a student's entire report-card history is small
 * enough that filtering adds little value" — see ReportCardListRequest), so
 * this is a plain paginated list rather than a filtered one.
 */
export default function StudentResultsPage() {
  const [page, setPage] = useState(1);
  const historyQuery = useReportCardHistory(page);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <h1 className="text-lg font-semibold">Results</h1>

      {historyQuery.isPending && <LoadingState label="Loading your results…" />}
      {historyQuery.isError && <ErrorState error={historyQuery.error} onRetry={() => historyQuery.refetch()} />}
      {historyQuery.isSuccess && historyQuery.data.data.length === 0 && (
        <EmptyState
          title="No published result is currently available."
          description="Results appear here once your school has published them."
        />
      )}

      {historyQuery.isSuccess && historyQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Overall %</TableHead>
                <TableHead>Avg. grade point</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyQuery.data.data.map((row) => (
                <TableRow key={`${row.enrollment.id}-${row.term.id}`}>
                  <TableCell>{row.term.academic_session.name}</TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/student/results/${row.enrollment.id}/${row.term.id}`} className="hover:underline">
                      {row.term.name}
                    </Link>
                  </TableCell>
                  <TableCell>{row.subjects_count}</TableCell>
                  <TableCell>{row.overall_percentage}%</TableCell>
                  <TableCell>{row.average_grade_point ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={historyQuery.data.meta.current_page}
            lastPage={historyQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}

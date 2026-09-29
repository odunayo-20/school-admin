"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/lib/auth/context";
import { canAccessResults, canApproveResults } from "@/lib/auth/permissions";
import { useAcademicSessions, useClasses, useSubjects } from "@/lib/academics/queries";
import { useResultBatches } from "@/lib/results/queries";
import type { ResultBatchStatus } from "@/lib/results/types";

const STATUS_LABELS: Record<ResultBatchStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  returned: "Returned",
  approved: "Approved",
  published: "Published",
};

function statusBadge(status: ResultBatchStatus) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "returned") return <Badge variant="outline">Returned</Badge>;
  return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
}

function ResultsList() {
  const { user } = useAuth();
  const isApprover = user ? canApproveResults(user.role) : false;

  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [status, setStatus] = useState<ResultBatchStatus | "">("");
  const [mineOnly, setMineOnly] = useState(!isApprover);
  const [page, setPage] = useState(1);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const subjectsQuery = useSubjects(1);

  const batchesQuery = useResultBatches({
    academic_session_id: sessionId ? Number(sessionId) : undefined,
    class_id: classId ? Number(classId) : undefined,
    subject_id: subjectId ? Number(subjectId) : undefined,
    status: status || undefined,
    mine: mineOnly,
    page,
  });

  function resetPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const hasFilters = Boolean(sessionId || classId || subjectId || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label htmlFor="rb-session" className="text-xs font-medium text-muted-foreground">
              Session
            </label>
            <Select id="rb-session" className="w-40" value={sessionId} onChange={(e) => resetPage(setSessionId)(e.target.value)}>
              <option value="">All sessions</option>
              {sessionsQuery.data?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="rb-class" className="text-xs font-medium text-muted-foreground">
              Class
            </label>
            <Select id="rb-class" className="w-36" value={classId} onChange={(e) => resetPage(setClassId)(e.target.value)}>
              <option value="">All classes</option>
              {classesQuery.data?.data.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="rb-subject" className="text-xs font-medium text-muted-foreground">
              Subject
            </label>
            <Select id="rb-subject" className="w-36" value={subjectId} onChange={(e) => resetPage(setSubjectId)(e.target.value)}>
              <option value="">All subjects</option>
              {subjectsQuery.data?.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <label htmlFor="rb-status" className="text-xs font-medium text-muted-foreground">
              Status
            </label>
            <Select
              id="rb-status"
              className="w-36"
              value={status}
              onChange={(e) => resetPage(setStatus)(e.target.value as ResultBatchStatus | "")}
            >
              <option value="">All statuses</option>
              {(Object.keys(STATUS_LABELS) as ResultBatchStatus[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={mineOnly}
              onChange={(e) => resetPage(setMineOnly)(e.target.checked)}
            />
            My batches only
          </label>
        </div>
        <Link href="/results/new" className={buttonVariants({ size: "sm" })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New batch
        </Link>
      </div>

      {batchesQuery.isPending && <LoadingState label="Loading result batches…" />}
      {batchesQuery.isError && <ErrorState error={batchesQuery.error} onRetry={() => batchesQuery.refetch()} />}

      {batchesQuery.isSuccess && batchesQuery.data.data.length === 0 && (
        <EmptyState
          title={hasFilters ? "No result batches match these filters." : "No result batches yet."}
          description={
            hasFilters
              ? "Try adjusting your filters."
              : "Create a result batch to start entering scores for a class and subject."
          }
          action={
            !hasFilters && (
              <Link href="/results/new" className={buttonVariants({ size: "sm" })}>
                New Batch
              </Link>
            )
          }
        />
      )}

      {batchesQuery.isSuccess && batchesQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session / Term</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Teacher</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchesQuery.data.data.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell>
                    {batch.academic_session.name} · {batch.term.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {batch.class.name}
                    {batch.section ? ` - ${batch.section.name}` : ""}
                  </TableCell>
                  <TableCell>{batch.subject.name}</TableCell>
                  <TableCell className="text-muted-foreground">{batch.teacher?.name ?? "—"}</TableCell>
                  <TableCell>{batch.student_count}</TableCell>
                  <TableCell>{statusBadge(batch.status)}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/results/${batch.id}`} className={buttonVariants({ variant: "ghost", size: "sm" })}>
                      View
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={batchesQuery.data.meta.current_page}
            lastPage={batchesQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Results</h1>
        <p className="text-sm text-muted-foreground">
          Enter, review, and manage student results by class and subject.
        </p>
      </div>
      <AdminOnly check={canAccessResults} description="Results are managed by teachers, registrars, and administrators.">
        <ResultsList />
      </AdminOnly>
    </main>
  );
}

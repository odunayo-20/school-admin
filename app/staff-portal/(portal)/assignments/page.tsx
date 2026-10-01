"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMyAssignments } from "@/lib/staff-portal/queries";

const STATUS_BADGE: Record<string, "default" | "outline"> = {
  ACTIVE: "default",
  ENDED: "outline",
  CANCELLED: "outline",
};

export default function MyTeachingAssignmentsPage() {
  const [status, setStatus] = useState("ACTIVE");
  const [page, setPage] = useState(1);
  const assignmentsQuery = useMyAssignments(status || undefined, page);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">My teaching</h1>
          <p className="text-sm text-muted-foreground">
            Every class subject you hold an assignment for.
          </p>
        </div>
        <Select
          className="w-40"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="ACTIVE">Active</option>
          <option value="ENDED">Ended</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="">All</option>
        </Select>
      </div>

      {assignmentsQuery.isPending && <LoadingState label="Loading your assignments…" />}
      {assignmentsQuery.isError && (
        <ErrorState error={assignmentsQuery.error} onRetry={() => assignmentsQuery.refetch()} />
      )}

      {assignmentsQuery.isSuccess && assignmentsQuery.data.data.length === 0 && (
        <EmptyState
          title="No assignments found."
          description={status ? "Try a different status filter." : "You have no teaching assignments on record."}
        />
      )}

      {assignmentsQuery.isSuccess && assignmentsQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Academic session</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignmentsQuery.data.data.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="font-medium">{assignment.class_subject.school_class.name}</TableCell>
                  <TableCell>{assignment.class_subject.subject.name}</TableCell>
                  <TableCell>{assignment.academic_session.name}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[assignment.status] ?? "outline"}>{assignment.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {assignment.status === "ACTIVE" ? (
                      <Link
                        href={`/staff-portal/assignments/${assignment.class_subject.id}?session=${assignment.academic_session.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Open →
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">Ended assignments are read-only history.</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <PaginationControls
            page={assignmentsQuery.data.meta.current_page}
            lastPage={assignmentsQuery.data.meta.last_page}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManagePromotions } from "@/lib/auth/permissions";
import { useAcademicSessions, useClasses } from "@/lib/academics/queries";
import { usePromotionHistory } from "@/lib/promotions/queries";
import type { PromotionDecision } from "@/lib/promotions/types";

const DECISION_LABELS: Record<PromotionDecision, string> = {
  promote: "Promoted",
  repeat: "Repeated",
  graduate: "Graduated",
};

function PromotionHistoryList() {
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [decision, setDecision] = useState<PromotionDecision | "">("");
  const [page, setPage] = useState(1);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);

  const historyQuery = usePromotionHistory({
    academic_session_id: sessionId ? Number(sessionId) : undefined,
    class_id: classId ? Number(classId) : undefined,
    decision: decision || undefined,
    page,
  });

  const hasFilters = Boolean(sessionId || classId || decision);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label htmlFor="history-session" className="text-xs text-muted-foreground">
            Session
          </Label>
          <Select
            id="history-session"
            className="w-40"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All sessions</option>
            {sessionsQuery.data?.data.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="history-class" className="text-xs text-muted-foreground">
            Class
          </Label>
          <Select
            id="history-class"
            className="w-36"
            value={classId}
            onChange={(e) => {
              setClassId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All classes</option>
            {classesQuery.data?.data.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="history-decision" className="text-xs text-muted-foreground">
            Decision
          </Label>
          <Select
            id="history-decision"
            className="w-36"
            value={decision}
            onChange={(e) => {
              setDecision(e.target.value as PromotionDecision | "");
              setPage(1);
            }}
          >
            <option value="">All decisions</option>
            <option value="promote">Promoted</option>
            <option value="repeat">Repeated</option>
            <option value="graduate">Graduated</option>
          </Select>
        </div>
      </div>

      {historyQuery.isPending && <LoadingState label="Loading promotion history…" />}
      {historyQuery.isError && <ErrorState error={historyQuery.error} onRetry={() => historyQuery.refetch()} />}
      {historyQuery.isSuccess && historyQuery.data.data.length === 0 && (
        <EmptyState
          title={hasFilters ? "No promotion records match these filters." : "No promotions have been run yet."}
        />
      )}
      {historyQuery.isSuccess && historyQuery.data.data.length > 0 && (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Promoted by</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyQuery.data.data.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${record.student.id}`} className="hover:underline">
                      {record.student.name}
                    </Link>
                  </TableCell>
                  <TableCell>{DECISION_LABELS[record.decision]}</TableCell>
                  <TableCell>
                    {record.from_class.name}
                    {record.from_section ? ` - ${record.from_section.name}` : ""}{" "}
                    <span className="text-muted-foreground">({record.from_academic_session.name})</span>
                  </TableCell>
                  <TableCell>
                    {record.to_class ? (
                      <>
                        {record.to_class.name}
                        {record.to_section ? ` - ${record.to_section.name}` : ""}{" "}
                        <span className="text-muted-foreground">({record.to_academic_session?.name})</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{record.promoted_by?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(record.promoted_at).toLocaleDateString()}
                  </TableCell>
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
    </div>
  );
}

export default function PromotionHistoryPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/promotions" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to promotions
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Promotion history</h1>
        <Link href="/promotions" className={buttonVariants({ variant: "outline", size: "sm" })}>
          Run a promotion
        </Link>
      </div>
      <AdminOnly check={canManagePromotions} description="Only authorized staff can view promotion history.">
        <PromotionHistoryList />
      </AdminOnly>
    </main>
  );
}

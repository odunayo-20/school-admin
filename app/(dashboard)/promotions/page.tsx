"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { DecisionFields, type DecisionFieldsValue } from "@/components/promotions/decision-fields";
import { EligibilityBadge } from "@/components/promotions/eligibility-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManagePromotions } from "@/lib/auth/permissions";
import { useAcademicSessions, useClassDetail, useClasses } from "@/lib/academics/queries";
import { useExecuteBulkPromotion, usePromotionCandidates } from "@/lib/promotions/queries";
import { ApiError } from "@/lib/api/errors";
import type { PromotionRecord } from "@/lib/promotions/types";

interface RowState extends DecisionFieldsValue {
  included: boolean;
}

const DECISION_SUMMARY_LABEL: Record<DecisionFieldsValue["decision"], string> = {
  promote: "promoted",
  repeat: "repeating",
  graduate: "graduating",
};

function PromotionWizard() {
  const [fromSessionId, setFromSessionId] = useState("");
  const [fromClassId, setFromClassId] = useState("");
  const [fromSectionId, setFromSectionId] = useState("");
  const [toSessionId, setToSessionId] = useState("");
  const [rows, setRows] = useState<Record<number, RowState>>({});
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [result, setResult] = useState<PromotionRecord[] | null>(null);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const fromClassDetailQuery = useClassDetail(Number(fromClassId) || 0);
  const sections = fromClassId ? fromClassDetailQuery.data?.sections ?? [] : [];

  const candidatesQuery = usePromotionCandidates({
    academic_session_id: Number(fromSessionId) || 0,
    class_id: Number(fromClassId) || 0,
    section_id: fromSectionId ? Number(fromSectionId) : undefined,
  });

  const executePromotion = useExecuteBulkPromotion();

  const candidates = candidatesQuery.data ?? [];
  const cohortKey = `${fromSessionId}-${fromClassId}-${fromSectionId}`;
  const fromClassName = classesQuery.data?.data.find((c) => String(c.id) === fromClassId)?.name ?? "this class";

  // Initialize per-student decisions when a different cohort has loaded, not
  // on every background refetch of the same one — same render-time reset
  // pattern used for Module 06's result-entry drafts, rather than an effect.
  if (candidatesQuery.isSuccess && loadedKey !== cohortKey) {
    const initial: Record<number, RowState> = {};
    for (const candidate of candidates) {
      initial[candidate.student.id] = {
        included: true,
        decision: candidate.suggested_decision,
        to_class_id:
          candidate.suggested_decision === "promote"
            ? candidate.suggested_class?.id ?? null
            : candidate.suggested_decision === "repeat"
              ? Number(fromClassId)
              : null,
        to_section_id: null,
      };
    }
    setRows(initial);
    setLoadedKey(cohortKey);
    setResult(null);
  }

  const includedCandidates = candidates.filter((c) => rows[c.student.id]?.included);
  const hasMissingClass = includedCandidates.some(
    (c) => rows[c.student.id]?.decision === "promote" && !rows[c.student.id]?.to_class_id
  );
  const needsToSession = includedCandidates.some((c) => rows[c.student.id]?.decision !== "graduate");

  function updateRow(studentId: number, next: Partial<RowState>) {
    setRows((prev) => ({ ...prev, [studentId]: { ...prev[studentId], ...next } }));
  }

  function toggleAll(included: boolean) {
    setRows((prev) => {
      const next = { ...prev };
      for (const candidate of candidates) {
        next[candidate.student.id] = { ...next[candidate.student.id], included };
      }
      return next;
    });
  }

  async function handleExecute() {
    if (needsToSession && !toSessionId) {
      setActionError("Select the academic session to promote into.");
      return;
    }
    if (includedCandidates.length === 0) {
      setActionError("Select at least one student to include.");
      return;
    }
    const counts = { promote: 0, repeat: 0, graduate: 0 };
    for (const candidate of includedCandidates) counts[rows[candidate.student.id].decision]++;
    if (
      !window.confirm(
        `Execute promotion for ${includedCandidates.length} student(s)? ${counts.promote} promoted, ${counts.repeat} repeating, ${counts.graduate} graduating. This creates new enrollment records immediately.`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      const records = await executePromotion.mutateAsync({
        from_academic_session_id: Number(fromSessionId),
        to_academic_session_id: needsToSession ? Number(toSessionId) : null,
        decisions: includedCandidates.map((candidate) => {
          const row = rows[candidate.student.id];
          return {
            student_id: candidate.student.id,
            enrollment_id: candidate.enrollment_id,
            decision: row.decision,
            to_class_id: row.decision === "graduate" ? null : row.to_class_id,
            to_section_id: row.decision === "graduate" ? null : row.to_section_id,
          };
        }),
      });
      setResult(records);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  function startOver() {
    setFromSessionId("");
    setFromClassId("");
    setFromSectionId("");
    setToSessionId("");
    setLoadedKey(null);
    setResult(null);
    setActionError(null);
  }

  if (result) {
    const counts = { promote: 0, repeat: 0, graduate: 0 };
    for (const record of result) counts[record.decision]++;
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-border bg-card p-4">
          <h2 className="text-base font-semibold">Promotion complete</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {result.length} student{result.length === 1 ? "" : "s"} processed — {counts.promote} promoted,{" "}
            {counts.repeat} repeating, {counts.graduate} graduated.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Decision</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.map((record) => (
              <TableRow key={record.id}>
                <TableCell className="font-medium">{record.student.name}</TableCell>
                <TableCell className="capitalize">{DECISION_SUMMARY_LABEL[record.decision]}</TableCell>
                <TableCell>
                  {record.from_class.name}
                  {record.from_section ? ` - ${record.from_section.name}` : ""}
                </TableCell>
                <TableCell>
                  {record.to_class ? (
                    <>
                      {record.to_class.name}
                      {record.to_section ? ` - ${record.to_section.name}` : ""}
                    </>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="flex gap-2">
          <Button onClick={startOver}>Run another promotion</Button>
          <Link href="/promotions/history" className={buttonVariants({ variant: "outline" })}>
            View promotion history
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="space-y-1">
          <Label htmlFor="promo-from-session" className="text-xs text-muted-foreground">
            From session
          </Label>
          <Select
            id="promo-from-session"
            className="w-44"
            value={fromSessionId}
            onChange={(e) => {
              setFromSessionId(e.target.value);
            }}
          >
            <option value="">Select a session…</option>
            {sessionsQuery.data?.data.map((session) => (
              <option key={session.id} value={session.id}>
                {session.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="promo-from-class" className="text-xs text-muted-foreground">
            From class
          </Label>
          <Select
            id="promo-from-class"
            className="w-40"
            value={fromClassId}
            onChange={(e) => {
              setFromClassId(e.target.value);
              setFromSectionId("");
            }}
          >
            <option value="">Select a class…</option>
            {classesQuery.data?.data.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </Select>
        </div>
        {sections.length > 0 && (
          <div className="space-y-1">
            <Label htmlFor="promo-from-section" className="text-xs text-muted-foreground">
              From section
            </Label>
            <Select
              id="promo-from-section"
              className="w-36"
              value={fromSectionId}
              onChange={(e) => setFromSectionId(e.target.value)}
            >
              <option value="">All sections</option>
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </Select>
          </div>
        )}
        <div className="space-y-1">
          <Label htmlFor="promo-to-session" className="text-xs text-muted-foreground">
            To session
          </Label>
          <Select id="promo-to-session" className="w-44" value={toSessionId} onChange={(e) => setToSessionId(e.target.value)}>
            <option value="">Select a session…</option>
            {sessionsQuery.data?.data
              .filter((session) => String(session.id) !== fromSessionId)
              .map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
          </Select>
        </div>
      </div>

      {!fromSessionId || !fromClassId ? (
        <EmptyState
          title="Select a session and class to review promotion candidates."
          description="Eligibility and suggested decisions are computed by the backend from each student's published results."
        />
      ) : (
        <>
          {candidatesQuery.isPending && <LoadingState label="Loading candidates…" />}
          {candidatesQuery.isError && (
            <ErrorState error={candidatesQuery.error} onRetry={() => candidatesQuery.refetch()} />
          )}
          {candidatesQuery.isSuccess && candidates.length === 0 && (
            <EmptyState title="No active students in this cohort." />
          )}
          {candidatesQuery.isSuccess && candidates.length > 0 && (
            <div className="space-y-3">
              {actionError && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {actionError}
                </p>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {includedCandidates.length} of {candidates.length} selected
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleAll(true)}>
                    Select all
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleAll(false)}>
                    Deselect all
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">
                      <span className="sr-only">Include</span>
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Decision</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {candidates.map((candidate) => {
                    const row = rows[candidate.student.id];
                    if (!row) return null;
                    return (
                      <TableRow key={candidate.student.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            aria-label={`Include ${candidate.student.name}`}
                            checked={row.included}
                            onChange={(e) => updateRow(candidate.student.id, { ...row, included: e.target.checked })}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {candidate.student.name}
                          <p className="font-normal text-muted-foreground">{candidate.student.student_no}</p>
                        </TableCell>
                        <TableCell>
                          <EligibilityBadge eligibility={candidate.eligibility} />
                          {candidate.eligibility_note && (
                            <p className="mt-1 max-w-xs text-xs text-muted-foreground">{candidate.eligibility_note}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          <DecisionFields
                            idPrefix={`promo-${candidate.student.id}`}
                            fromClassId={Number(fromClassId)}
                            fromClassName={fromClassName}
                            classes={classesQuery.data?.data ?? []}
                            value={row}
                            onChange={(next) => updateRow(candidate.student.id, next)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {hasMissingClass && (
                <p className="text-sm text-muted-foreground">
                  Every student being promoted needs a target class before you can execute.
                </p>
              )}

              <Button
                disabled={
                  executePromotion.isPending ||
                  includedCandidates.length === 0 ||
                  hasMissingClass ||
                  (needsToSession && !toSessionId)
                }
                onClick={handleExecute}
              >
                {executePromotion.isPending ? "Executing…" : `Execute promotion (${includedCandidates.length})`}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PromotionsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">Promotion & Progression</h1>
        <Link href="/promotions/history" className={buttonVariants({ variant: "outline", size: "sm" })}>
          View history
        </Link>
      </div>
      <AdminOnly check={canManagePromotions} description="Only authorized staff can run student promotions.">
        <PromotionWizard />
      </AdminOnly>
    </main>
  );
}

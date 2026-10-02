"use client";

import { useState } from "react";
import { DecisionFields, type DecisionFieldsValue } from "@/components/promotions/decision-fields";
import { EligibilityBadge } from "@/components/promotions/eligibility-badge";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAcademicSessions, useClasses } from "@/lib/academics/queries";
import { useExecuteBulkPromotion, usePromotionCandidates } from "@/lib/promotions/queries";
import { ApiError } from "@/lib/api/errors";
import type { CurrentEnrollmentSummary } from "@/lib/students/types";

/**
 * Individual promotion for a single student, from their profile page. Reuses
 * the exact same candidate lookup and bulk-execute endpoint as the school-
 * wide wizard (app/(dashboard)/promotions/page.tsx) with a one-item array —
 * there is no separate "single promotion" mechanism.
 */
export function PromoteDialog({
  open,
  onOpenChange,
  studentId,
  studentName,
  currentEnrollment,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
  studentName: string;
  currentEnrollment: CurrentEnrollmentSummary;
}) {
  const [toSessionId, setToSessionId] = useState("");
  const [decisionValue, setDecisionValue] = useState<DecisionFieldsValue | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [loadedForClass, setLoadedForClass] = useState<number | null>(null);

  const currentClass = currentEnrollment?.class || currentEnrollment?.school_class;
  const currentClassId = currentClass?.id ?? 0;
  const currentClassName = currentClass?.name || "Class";

  const currentSession = currentEnrollment?.academic_session;
  const currentSessionId = currentSession?.id ?? 0;
  const currentSessionName = currentSession?.name || "Academic Session";

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const candidatesQuery = usePromotionCandidates({
    academic_session_id: currentSessionId,
    class_id: currentClassId,
    section_id: currentEnrollment?.section?.id,
  });

  const executePromotion = useExecuteBulkPromotion();

  const candidate = candidatesQuery.data?.find((c) => c.student.id === studentId);

  if (candidate && loadedForClass !== currentClassId && currentClassId > 0) {
    setDecisionValue({
      decision: candidate.suggested_decision,
      to_class_id:
        candidate.suggested_decision === "promote"
          ? candidate.suggested_class?.id ?? null
          : candidate.suggested_decision === "repeat"
            ? currentClassId
            : null,
      to_section_id: null,
    });
    setLoadedForClass(currentClassId);
  }

  function reset() {
    setToSessionId("");
    setDecisionValue(null);
    setLoadedForClass(null);
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!decisionValue || !candidate) return;
    const needsToSession = decisionValue.decision !== "graduate";
    if (needsToSession && !toSessionId) {
      setFormError("Select the academic session to promote into.");
      return;
    }
    if (decisionValue.decision === "promote" && !decisionValue.to_class_id) {
      setFormError("Select a target class.");
      return;
    }
    setFormError(null);
    try {
      await executePromotion.mutateAsync({
        from_academic_session_id: currentSessionId,
        to_academic_session_id: needsToSession ? Number(toSessionId) : null,
        decisions: [
          {
            student_id: studentId,
            enrollment_id: candidate.enrollment_id,
            decision: decisionValue.decision,
            to_class_id: decisionValue.decision === "graduate" ? null : decisionValue.to_class_id,
            to_section_id: decisionValue.decision === "graduate" ? null : decisionValue.to_section_id,
          },
        ],
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Promote {studentName}</DialogTitle>
          <DialogDescription>
            Currently in {currentClassName}
            {currentEnrollment?.section ? ` - ${currentEnrollment.section.name}` : ""} (
            {currentSessionName}).
          </DialogDescription>
        </DialogHeader>

        {candidatesQuery.isPending && <LoadingState label="Checking eligibility…" />}
        {candidatesQuery.isError && (
          <ErrorState error={candidatesQuery.error} onRetry={() => candidatesQuery.refetch()} />
        )}

        {candidate && decisionValue && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </p>
            )}

            <div className="flex items-center gap-2">
              <EligibilityBadge eligibility={candidate.eligibility} />
              {candidate.eligibility_note && (
                <p className="text-xs text-muted-foreground">{candidate.eligibility_note}</p>
              )}
            </div>

            {decisionValue.decision !== "graduate" && (
              <div className="space-y-2">
                <Label htmlFor="promote-to-session">To session</Label>
                <Select id="promote-to-session" value={toSessionId} onChange={(e) => setToSessionId(e.target.value)}>
                  <option value="">Select a session…</option>
                  {sessionsQuery.data?.data
                    .filter((session) => session.id !== currentSessionId)
                    .map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}

            <DecisionFields
              idPrefix="promote-dialog"
              fromClassId={currentClassId}
              fromClassName={currentClassName}
              classes={classesQuery.data?.data ?? []}
              value={decisionValue}
              onChange={setDecisionValue}
            />

            <Button type="submit" className="w-full" disabled={executePromotion.isPending}>
              {executePromotion.isPending ? "Processing…" : "Confirm"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

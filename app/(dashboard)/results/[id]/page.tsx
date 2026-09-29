"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { EntryDraft, ResultEntryTable } from "@/components/results/result-entry-table";
import { useAuth } from "@/lib/auth/context";
import { canAccessResults, canApproveResults, canEnterResults } from "@/lib/auth/permissions";
import {
  useApproveResultBatch,
  usePublishResultBatch,
  useResultBatch,
  useReturnResultBatch,
  useSaveResultEntries,
  useSubmitResultBatch,
} from "@/lib/results/queries";
import { ApiError } from "@/lib/api/errors";
import type { ResultBatchStatus } from "@/lib/results/types";

const STATUS_LABELS: Record<ResultBatchStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  returned: "Returned",
  approved: "Approved",
  published: "Published",
};

function buildDrafts(entries: { student: { id: number }; ca_score: number | null; exam_score: number | null }[]) {
  const drafts: Record<number, EntryDraft> = {};
  for (const entry of entries) {
    drafts[entry.student.id] = {
      ca_score: entry.ca_score?.toString() ?? "",
      exam_score: entry.exam_score?.toString() ?? "",
    };
  }
  return drafts;
}

function ReturnReasonDialog({
  open,
  onOpenChange,
  onSubmit,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => Promise<void>;
  isPending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Return for correction</DialogTitle>
          <DialogDescription>
            The teacher will be able to edit and resubmit these results. Explain what needs fixing.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!reason.trim()) {
              setError("A reason is required.");
              return;
            }
            setError(null);
            await onSubmit(reason.trim());
            setReason("");
          }}
        >
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="return-reason">Reason</Label>
            <textarea
              id="return-reason"
              className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Returning…" : "Return results"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function statusBadge(status: ResultBatchStatus) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "returned") return <Badge variant="outline">Returned</Badge>;
  return <Badge variant="outline">{STATUS_LABELS[status]}</Badge>;
}

function BatchDetailContent({ batchId }: { batchId: number }) {
  const { user } = useAuth();
  const batchQuery = useResultBatch(batchId);
  const saveEntries = useSaveResultEntries(batchId);
  const submitBatch = useSubmitResultBatch(batchId);
  const approveBatch = useApproveResultBatch(batchId);
  const returnBatch = useReturnResultBatch(batchId);
  const publishBatch = usePublishResultBatch(batchId);

  const [drafts, setDrafts] = useState<Record<number, EntryDraft>>({});
  const [savedDrafts, setSavedDrafts] = useState<Record<number, EntryDraft>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [loadedBatchId, setLoadedBatchId] = useState<number | null>(null);

  const batch = batchQuery.data;

  // Re-initialize local edits only when a different batch has loaded, not on
  // every background refetch of the same one (which would wipe in-progress
  // typing). This updates state during render rather than in an effect —
  // React's documented pattern for resetting state when data changes.
  if (batch && batch.id !== loadedBatchId) {
    const initial = buildDrafts(batch.entries);
    setDrafts(initial);
    setSavedDrafts(initial);
    setLoadedBatchId(batch.id);
  }

  const isDirty = JSON.stringify(drafts) !== JSON.stringify(savedDrafts);

  useEffect(() => {
    function handler(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (batchQuery.isPending) return <LoadingState label="Loading result batch…" />;
  if (batchQuery.isError) return <ErrorState error={batchQuery.error} onRetry={() => batchQuery.refetch()} />;
  if (!batch) return null;

  const isEditableStatus = batch.status === "draft" || batch.status === "returned";
  const canEdit = isEditableStatus && user !== null && canEnterResults(user.role);
  const canReview = user !== null && canApproveResults(user.role);
  const incompleteCount = Object.values(drafts).filter((d) => !d.ca_score || !d.exam_score).length;

  const handleChange = (studentId: number, field: "ca_score" | "exam_score", value: string) => {
    setDrafts((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  };

  const handleSaveDraft = async () => {
    setActionError(null);
    try {
      await saveEntries.mutateAsync(
        Object.entries(drafts).map(([studentId, d]) => ({
          student_id: Number(studentId),
          ca_score: d.ca_score === "" ? null : Number(d.ca_score),
          exam_score: d.exam_score === "" ? null : Number(d.exam_score),
        }))
      );
      setSavedDrafts(drafts);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  };

  const handleSubmit = async () => {
    if (
      !window.confirm(
        `Submit these ${batch.student_count} results for approval? You won't be able to edit them unless they're returned for correction.`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      await submitBatch.mutateAsync();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  };

  const handleApprove = async () => {
    if (!window.confirm(`Approve these results for ${batch.subject.name} (${batch.class.name})?`)) return;
    setActionError(null);
    try {
      await approveBatch.mutateAsync();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  };

  const handlePublish = async () => {
    if (
      !window.confirm(
        `Publish these results? Once published they become visible on students' records and can no longer be edited.`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      await publishBatch.mutateAsync();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  };

  const handleReturn = async (reason: string) => {
    setActionError(null);
    try {
      await returnBatch.mutateAsync(reason);
      setReturnDialogOpen(false);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  };

  return (
    <div className="space-y-6">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">
              {batch.subject.name} — {batch.class.name}
              {batch.section ? ` - ${batch.section.name}` : ""}
            </h2>
            {statusBadge(batch.status)}
          </div>
          <p className="text-sm text-muted-foreground">
            {batch.academic_session.name} · {batch.term.name} · {batch.student_count} student
            {batch.student_count === 1 ? "" : "s"}
            {batch.teacher && ` · ${batch.teacher.name}`}
          </p>
          {batch.status === "returned" && batch.return_reason && (
            <p className="mt-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
              <span className="font-medium">Returned: </span>
              {batch.return_reason}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="outline" size="sm" disabled={saveEntries.isPending || !isDirty} onClick={handleSaveDraft}>
              {saveEntries.isPending ? "Saving…" : "Save draft"}
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              disabled={submitBatch.isPending || isDirty || incompleteCount > 0}
              onClick={handleSubmit}
            >
              Submit
            </Button>
          )}
          {canReview && batch.status === "submitted" && (
            <>
              <Button variant="outline" size="sm" onClick={() => setReturnDialogOpen(true)}>
                Return
              </Button>
              <Button size="sm" disabled={approveBatch.isPending} onClick={handleApprove}>
                {approveBatch.isPending ? "Approving…" : "Approve"}
              </Button>
            </>
          )}
          {canReview && batch.status === "approved" && (
            <Button size="sm" disabled={publishBatch.isPending} onClick={handlePublish}>
              {publishBatch.isPending ? "Publishing…" : "Publish"}
            </Button>
          )}
        </div>
      </div>

      {canEdit && isDirty && (
        <p className="text-sm text-muted-foreground">You have unsaved changes — save as a draft to submit.</p>
      )}
      {canEdit && !isDirty && incompleteCount > 0 && (
        <p className="text-sm text-muted-foreground">
          {incompleteCount} of {batch.entries.length} students have incomplete scores — submission is disabled
          until every student has both scores.
        </p>
      )}

      <ResultEntryTable entries={batch.entries} drafts={drafts} editable={canEdit} onChange={handleChange} />

      <ReturnReasonDialog
        open={returnDialogOpen}
        onOpenChange={setReturnDialogOpen}
        onSubmit={handleReturn}
        isPending={returnBatch.isPending}
      />
    </div>
  );
}

export default function ResultBatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const batchId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to results
      </Link>
      <AdminOnly check={canAccessResults} description="Only authorized staff can view result batches.">
        <BatchDetailContent batchId={batchId} />
      </AdminOnly>
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  GraduationCap,
  Info,
  Plus,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { useAcademicSessions, useClassDetail, useClasses } from "@/lib/academics/queries";
import {
  useCancelTeacherAssignment,
  useCreateTeacherAssignment,
  useEndTeacherAssignment,
  useStaffTeacherAssignments,
  useUpdateTeacherAssignment,
} from "@/lib/staff/queries";
import { ApiError } from "@/lib/api/errors";
import type { TeacherAssignment, TeacherAssignmentStatus } from "@/lib/staff/types";

// ── Assign Subject Dialog ─────────────────────────────────────────────

function AssignSubjectDialog({
  open,
  onOpenChange,
  staffId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
}) {
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [classSubjectId, setClassSubjectId] = useState("");
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const classDetailQuery = useClassDetail(Number(classId));

  const createAssignment = useCreateTeacherAssignment(staffId);

  // Subjects offered by the selected class (each has class_subject_id)
  const subjects = useMemo(() => {
    return classId ? classDetailQuery.data?.subjects ?? [] : [];
  }, [classId, classDetailQuery.data]);

  // Set default session to current active session when loaded
  const currentSession = sessionsQuery.data?.data.find((s) => s.is_current);

  function handleOpen(next: boolean) {
    if (next && !sessionId && currentSession) {
      setSessionId(String(currentSession.id));
    }
    if (!next) {
      reset();
    }
    onOpenChange(next);
  }

  function reset() {
    setSessionId(currentSession ? String(currentSession.id) : "");
    setClassId("");
    setClassSubjectId("");
    setNotes("");
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionId || !classId || !classSubjectId) return;
    setFormError(null);

    try {
      await createAssignment.mutateAsync({
        teaching_staff_id: staffId,
        academic_session_id: Number(sessionId),
        class_subject_id: Number(classSubjectId),
        notes: notes.trim() || null,
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-1">
            <GraduationCap className="h-5 w-5" />
          </div>
          <DialogTitle>Assign subject teaching duty</DialogTitle>
          <DialogDescription>
            Assign this educator to teach a class subject for an academic session.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {formError && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive leading-relaxed"
            >
              {formError}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sta-session" className="text-xs font-medium">
              Academic session
            </Label>
            <Select
              id="sta-session"
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              className="w-full text-sm"
              required
            >
              <option value="">Select an academic session…</option>
              {sessionsQuery.data?.data.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} {session.is_current ? "(Current)" : ""}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sta-class" className="text-xs font-medium">
              Class
            </Label>
            <Select
              id="sta-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setClassSubjectId("");
              }}
              className="w-full text-sm"
              required
            >
              <option value="">Select a class…</option>
              {classesQuery.data?.data.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </Select>
          </div>

          {classId && (
            <div className="space-y-1.5">
              <Label htmlFor="sta-subject" className="text-xs font-medium">
                Subject
              </Label>
              {classDetailQuery.isPending ? (
                <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  Loading subjects for this class…
                </div>
              ) : subjects.length === 0 ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50/50 p-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                  No active subjects configured for this class yet. Add subjects to this class in
                  Academics first.
                </p>
              ) : (
                <Select
                  id="sta-subject"
                  value={classSubjectId}
                  onChange={(e) => setClassSubjectId(e.target.value)}
                  className="w-full text-sm"
                  required
                >
                  <option value="">Select a subject to teach…</option>
                  {subjects.map((subj: any) => (
                    <option key={subj.class_subject_id ?? subj.id} value={subj.class_subject_id ?? subj.id}>
                      {subj.name} {subj.code ? `(${subj.code})` : ""}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="sta-notes" className="text-xs font-medium text-muted-foreground">
              Assignment notes <span className="font-normal">(optional)</span>
            </Label>
            <Input
              id="sta-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Primary lead teacher for term syllabus"
              className="text-sm"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={createAssignment.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={
                createAssignment.isPending || !sessionId || !classId || !classSubjectId
              }
            >
              {createAssignment.isPending ? "Assigning…" : "Assign teacher"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── End Assignment Dialog ─────────────────────────────────────────────

function EndAssignmentDialog({
  assignment,
  open,
  onOpenChange,
  staffId,
}: {
  assignment: TeacherAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const endMutation = useEndTeacherAssignment(staffId);

  if (!assignment) return null;
  const target = assignment;

  async function handleConfirm() {
    setError(null);
    try {
      await endMutation.mutateAsync({
        id: target.id,
        data: { notes: notes.trim() || undefined },
      });
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to end assignment.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 mb-1">
            <Clock className="h-5 w-5" />
          </div>
          <DialogTitle>End teaching assignment</DialogTitle>
          <DialogDescription>
            Record that this educator stopped teaching{" "}
            <strong>{target.subject?.name ?? "this subject"}</strong> for{" "}
            <strong>{target.class?.name ?? "this class"}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-sm">
          <p className="text-xs text-muted-foreground">
            This action records the conclusion of teaching duties and frees this class subject slot
            for reassignment in the <strong>{target.academic_session?.name}</strong> session.
          </p>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="end-notes" className="text-xs font-medium">
              Reason / Concluding notes <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="end-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Completed syllabus, reassigned mid-term"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Keep active
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConfirm}
            disabled={endMutation.isPending}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {endMutation.isPending ? "Ending…" : "End assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Cancel Assignment Dialog ──────────────────────────────────────────

function CancelAssignmentDialog({
  assignment,
  open,
  onOpenChange,
  staffId,
}: {
  assignment: TeacherAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
}) {
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelMutation = useCancelTeacherAssignment(staffId);

  if (!assignment) return null;
  const target = assignment;

  async function handleConfirm() {
    setError(null);
    try {
      await cancelMutation.mutateAsync({
        id: target.id,
        data: { notes: notes.trim() || undefined },
      });
      setNotes("");
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to cancel assignment.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-1">
            <XCircle className="h-5 w-5" />
          </div>
          <DialogTitle>Void / Cancel assignment</DialogTitle>
          <DialogDescription>
            Void this assignment record. Use this if the assignment was created in error.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-sm">
          <p className="text-xs text-muted-foreground">
            Cancelling preserves an audit trail while freeing the{" "}
            <strong>{target.subject?.name}</strong> slot in{" "}
            <strong>{target.class?.name}</strong>.
          </p>

          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="cancel-notes" className="text-xs font-medium">
              Reason for cancellation <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              id="cancel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Assigned to incorrect teacher by mistake"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Keep assignment
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleConfirm}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? "Cancelling…" : "Void assignment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Edit Notes Dialog ─────────────────────────────────────────────────

function EditNotesDialog({
  assignment,
  open,
  onOpenChange,
  staffId,
}: {
  assignment: TeacherAssignment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
}) {
  const [notes, setNotes] = useState(assignment?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const updateMutation = useUpdateTeacherAssignment(staffId);

  if (!assignment) return null;
  const target = assignment;

  async function handleSave() {
    setError(null);
    try {
      await updateMutation.mutateAsync({
        id: target.id,
        data: { notes: notes.trim() || null },
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update notes.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit assignment notes</DialogTitle>
          <DialogDescription>
            {target.subject?.name} · {target.class?.name} (
            {target.academic_session?.name})
          </DialogDescription>
        </DialogHeader>


        <div className="space-y-3 pt-2">
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-notes" className="text-xs font-medium">
              Notes
            </Label>
            <Input
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Primary teacher"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving…" : "Save notes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────

export function SubjectTeacherAssignments({ staffId }: { staffId: number }) {
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [endingAssignment, setEndingAssignment] = useState<TeacherAssignment | null>(null);
  const [cancellingAssignment, setCancellingAssignment] = useState<TeacherAssignment | null>(null);
  const [editingNotesAssignment, setEditingNotesAssignment] = useState<TeacherAssignment | null>(null);
  const [statusFilter, setStatusFilter] = useState<"ALL" | TeacherAssignmentStatus>("ALL");

  const assignmentsQuery = useStaffTeacherAssignments(staffId);
  const allAssignments = assignmentsQuery.data ?? [];

  // Filtered by selected tab
  const filteredAssignments = useMemo(() => {
    if (statusFilter === "ALL") return allAssignments;
    return allAssignments.filter((a) => a.status === statusFilter);
  }, [allAssignments, statusFilter]);

  const activeCount = allAssignments.filter((a) => a.status === "ACTIVE").length;

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-card p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">
              Subject teacher assignments
            </h2>
            {activeCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                {activeCount} active
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Curriculum subjects and classes assigned to this teacher across academic sessions.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setAssignDialogOpen(true)}
          className="gap-1.5 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Assign subject
        </Button>
      </div>

      {/* Filter Tabs */}
      {allAssignments.length > 0 && (
        <div className="flex items-center gap-1.5 border-b border-border/60 pb-2">
          {(["ALL", "ACTIVE", "ENDED", "CANCELLED"] as const).map((status) => {
            const count =
              status === "ALL"
                ? allAssignments.length
                : allAssignments.filter((a) => a.status === status).length;
            const isSelected = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                <span>{status === "ALL" ? "All" : status.charAt(0) + status.slice(1).toLowerCase()}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* States */}
      {assignmentsQuery.isPending && (
        <LoadingState label="Loading subject assignments…" />
      )}

      {assignmentsQuery.isError && (
        <ErrorState
          error={assignmentsQuery.error}
          onRetry={() => assignmentsQuery.refetch()}
        />
      )}

      {assignmentsQuery.isSuccess && allAssignments.length === 0 && (
        <div className="rounded-xl border border-dashed border-border/80 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
            <BookOpen className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">No subject assignments yet</h3>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            This educator has not been assigned to teach any class subjects. Click below to add their
            first assignment.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setAssignDialogOpen(true)}
            className="mt-4 gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Assign first subject
          </Button>
        </div>
      )}

      {assignmentsQuery.isSuccess && allAssignments.length > 0 && filteredAssignments.length === 0 && (
        <p className="py-6 text-center text-xs text-muted-foreground">
          No assignments with status &ldquo;{statusFilter.toLowerCase()}&rdquo;.
        </p>
      )}

      {/* Assignments list */}
      {assignmentsQuery.isSuccess && filteredAssignments.length > 0 && (
        <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden">
          {filteredAssignments.map((assignment) => {
            const isActive = assignment.status === "ACTIVE";
            const isEnded = assignment.status === "ENDED";
            const isCancelled = assignment.status === "CANCELLED";

            return (
              <li
                key={assignment.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30"
              >
                {/* Subject & Class info */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-sm text-foreground">
                      {assignment.subject?.name ?? "Subject"}
                    </span>
                    {assignment.subject?.code && (
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                        {assignment.subject.code}
                      </span>
                    )}
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs font-medium text-foreground/90">
                      {assignment.class?.name ?? "Class"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground/80" />
                      {assignment.academic_session?.name ?? "Session"}
                    </span>

                    {assignment.notes && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground/90 italic">
                        &ldquo;{assignment.notes}&rdquo;
                      </span>
                    )}

                    {assignment.ended_at && (
                      <span className="text-[11px] text-muted-foreground/75">
                        Ended {new Date(assignment.ended_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {/* Status Pill */}
                  {isActive && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </span>
                  )}
                  {isEnded && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      <Clock className="h-3 w-3" />
                      Ended
                    </span>
                  )}
                  {isCancelled && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground line-through">
                      Voided
                    </span>
                  )}

                  {/* Actions for ACTIVE assignments */}
                  {isActive && (
                    <div className="flex items-center gap-1 border-l border-border/60 pl-2 ml-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEndingAssignment(assignment);
                        }}
                        className="h-8 px-2 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                        title="End assignment"
                      >
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        End
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingNotesAssignment(assignment);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit notes"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCancellingAssignment(assignment);
                        }}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Void assignment"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Dialogs */}
      <AssignSubjectDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        staffId={staffId}
      />
      <EndAssignmentDialog
        assignment={endingAssignment}
        open={Boolean(endingAssignment)}
        onOpenChange={(open) => !open && setEndingAssignment(null)}
        staffId={staffId}
      />
      <CancelAssignmentDialog
        assignment={cancellingAssignment}
        open={Boolean(cancellingAssignment)}
        onOpenChange={(open) => !open && setCancellingAssignment(null)}
        staffId={staffId}
      />
      <EditNotesDialog
        assignment={editingNotesAssignment}
        open={Boolean(editingNotesAssignment)}
        onOpenChange={(open) => !open && setEditingNotesAssignment(null)}
        staffId={staffId}
      />
    </section>
  );
}

// Named alias
export const TeacherAssignments = SubjectTeacherAssignments;

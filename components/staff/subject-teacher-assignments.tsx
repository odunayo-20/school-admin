"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { useAcademicSessions, useClassDetail, useClasses } from "@/lib/academics/queries";
import {
  useCreateSubjectAssignment,
  useDeleteSubjectAssignment,
  useSubjectAssignments,
} from "@/lib/staff/queries";
import { ApiError } from "@/lib/api/errors";

function AssignSubjectTeacherDialog({
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
  const [subjectId, setSubjectId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const classDetailQuery = useClassDetail(Number(classId));

  const createAssignment = useCreateSubjectAssignment(staffId);

  const subjects = classId ? classDetailQuery.data?.subjects ?? [] : [];

  function reset() {
    setSessionId("");
    setClassId("");
    setSubjectId("");
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionId || !classId || !subjectId) return;
    setFormError(null);
    try {
      await createAssignment.mutateAsync({
        academic_session_id: Number(sessionId),
        class_id: Number(classId),
        subject_id: Number(subjectId),
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
          <DialogTitle>Assign as subject teacher</DialogTitle>
          <DialogDescription>Choose the session, class, and subject.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="sta-session">Academic session</Label>
            <Select id="sta-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value="">Select a session…</option>
              {sessionsQuery.data?.data.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sta-class">Class</Label>
            <Select
              id="sta-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSubjectId("");
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

          {classId && (
            <div className="space-y-2">
              <Label htmlFor="sta-subject">Subject</Label>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This class has no subjects assigned yet.
                </p>
              ) : (
                <Select id="sta-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                  <option value="">Select a subject…</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createAssignment.isPending || !sessionId || !classId || !subjectId}
          >
            {createAssignment.isPending ? "Assigning…" : "Assign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SubjectTeacherAssignments({ staffId }: { staffId: number }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const assignmentsQuery = useSubjectAssignments(staffId);
  const deleteAssignment = useDeleteSubjectAssignment(staffId);

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">Subject teacher assignments</h2>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Assign
        </Button>
      </div>

      {assignmentsQuery.isPending && <LoadingState label="Loading assignments…" />}
      {assignmentsQuery.isError && (
        <ErrorState error={assignmentsQuery.error} onRetry={() => assignmentsQuery.refetch()} />
      )}
      {assignmentsQuery.isSuccess && assignmentsQuery.data.length === 0 && (
        <EmptyState title="No subject teacher assignments." />
      )}
      {assignmentsQuery.isSuccess && assignmentsQuery.data.length > 0 && (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {assignmentsQuery.data.map((assignment) => (
            <li key={assignment.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span>
                {assignment.subject.name} · {assignment.class.name}{" "}
                <span className="text-muted-foreground">({assignment.academic_session.name})</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={deleteAssignment.isPending}
                onClick={() =>
                  deleteAssignment.mutate({
                    id: assignment.id,
                    classId: assignment.class.id,
                    academicSessionId: assignment.academic_session.id,
                  })
                }
                aria-label="Remove assignment"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AssignSubjectTeacherDialog open={dialogOpen} onOpenChange={setDialogOpen} staffId={staffId} />
    </section>
  );
}

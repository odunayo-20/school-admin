"use client";

import { useState } from "react";
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
import { useAcademicSessions, useClassDetail, useClasses } from "@/lib/academics/queries";
import { useCreateEnrollment } from "@/lib/enrollment/queries";
import { ApiError } from "@/lib/api/errors";

export function EnrollDialog({
  open,
  onOpenChange,
  studentId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: number;
}) {
  const [sessionId, setSessionId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sessionsQuery = useAcademicSessions(1);
  const classesQuery = useClasses(1);
  const classDetailQuery = useClassDetail(Number(classId));

  const createEnrollment = useCreateEnrollment(studentId);

  const sections = classId ? classDetailQuery.data?.sections ?? [] : [];
  const needsSection = classId !== "" && sections.length > 0;

  function reset() {
    setSessionId("");
    setClassId("");
    setSectionId("");
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionId || !classId || (needsSection && !sectionId)) return;
    setFormError(null);
    try {
      await createEnrollment.mutateAsync({
        student_id: studentId,
        academic_session_id: Number(sessionId),
        class_id: Number(classId),
        section_id: needsSection ? Number(sectionId) : null,
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
          <DialogTitle>Enroll student</DialogTitle>
          <DialogDescription>Choose the session, class, and section to place this student into.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="enroll-session">Academic session</Label>
            <Select id="enroll-session" value={sessionId} onChange={(e) => setSessionId(e.target.value)}>
              <option value="">Select a session…</option>
              {sessionsQuery.data?.data.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enroll-class">Class</Label>
            <Select
              id="enroll-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId("");
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

          {needsSection && (
            <div className="space-y-2">
              <Label htmlFor="enroll-section">Section</Label>
              <Select id="enroll-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                <option value="">Select a section…</option>
                {sections.map((section) => (
                  <option key={section.id} value={section.id}>
                    {section.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={createEnrollment.isPending || !sessionId || !classId || (needsSection && !sectionId)}
          >
            {createEnrollment.isPending ? "Enrolling…" : "Enroll"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

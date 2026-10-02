"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Layers, Loader2 } from "lucide-react";
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

  const sessions = sessionsQuery.data?.data ?? [];
  const classes = classesQuery.data?.data ?? [];
  const sections = classId ? classDetailQuery.data?.sections ?? [] : [];
  const isLoadingSections = Boolean(classId && classDetailQuery.isPending);

  // Auto-select active session if available, and auto-select section when only one section exists
  const autoActiveSession = useMemo(() => {
    return sessions.find((s) => s.is_current || s.status === "ACTIVE") ?? sessions[0];
  }, [sessions]);

  const effectiveSessionId = sessionId || (autoActiveSession ? String(autoActiveSession.id) : "");
  const effectiveSectionId = sectionId || (sections.length === 1 ? String(sections[0].id) : "");

  function reset() {
    setSessionId("");
    setClassId("");
    setSectionId("");
    setFormError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!effectiveSessionId) {
      setFormError("Please select an academic session.");
      return;
    }
    if (!classId) {
      setFormError("Please select an instructional class.");
      return;
    }
    if (!effectiveSectionId) {
      setFormError("A section is required. Every student must be placed into a specific class arm/section.");
      return;
    }

    setFormError(null);
    try {
      await createEnrollment.mutateAsync({
        student_id: studentId,
        academic_session_id: Number(effectiveSessionId),
        class_id: Number(classId),
        section_id: Number(effectiveSectionId),
      });
      reset();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong while creating the enrollment.");
    }
  }

  const isSubmitDisabled =
    createEnrollment.isPending ||
    !effectiveSessionId ||
    !classId ||
    !effectiveSectionId ||
    isLoadingSections;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Layers className="h-5 w-5 text-primary" />
            Enroll Student in Class
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Assign the student to an academic session, instructional class, and designated arm.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Academic Session */}
          <div className="space-y-1.5">
            <Label htmlFor="enroll-session" className="text-xs font-semibold">
              Academic Session <span className="text-destructive">*</span>
            </Label>
            <Select
              id="enroll-session"
              value={effectiveSessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                setFormError(null);
              }}
              className="text-xs h-9"
            >
              <option value="">Select a session…</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.name} {session.is_current || session.status === "ACTIVE" ? "(Current Session)" : ""}
                </option>
              ))}
            </Select>
          </div>

          {/* Instructional Class */}
          <div className="space-y-1.5">
            <Label htmlFor="enroll-class" className="text-xs font-semibold">
              Class <span className="text-destructive">*</span>
            </Label>
            <Select
              id="enroll-class"
              value={classId}
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId("");
                setFormError(null);
              }}
              className="text-xs h-9"
            >
              <option value="">Select a class…</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </Select>
          </div>

          {/* Section / Arm (Strictly Required by Backend & DB Contract) */}
          {classId && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="enroll-section" className="text-xs font-semibold">
                  Section / Arm <span className="text-destructive">*</span>
                </Label>
                {isLoadingSections && (
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading arms…
                  </span>
                )}
              </div>

              {isLoadingSections ? (
                <div className="h-9 w-full rounded-md border border-border/60 bg-muted/30 animate-pulse" />
              ) : sections.length > 0 ? (
                <Select
                  id="enroll-section"
                  value={effectiveSectionId}
                  onChange={(e) => {
                    setSectionId(e.target.value);
                    setFormError(null);
                  }}
                  className="text-xs h-9"
                >
                  <option value="">Select a section / arm…</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.name} {section.code ? `(${section.code})` : ""}
                    </option>
                  ))}
                </Select>
              ) : (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No active sections for this class</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-600 dark:text-amber-400">
                    The school management system requires every enrolled student to be assigned to an active class arm.
                  </p>
                  <Link
                    href={`/academics/classes/${classId}`}
                    className="inline-flex items-center text-[11px] font-semibold text-primary underline"
                    onClick={() => onOpenChange(false)}
                  >
                    Go to Class Structure to add a section →
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-9 min-w-28"
              disabled={isSubmitDisabled}
            >
              {createEnrollment.isPending ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Enrolling…
                </span>
              ) : (
                "Enroll Student"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

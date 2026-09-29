"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { canAccessResults } from "@/lib/auth/permissions";
import { useAcademicSessions, useClassDetail, useClasses, useTerms } from "@/lib/academics/queries";
import { useMyStaffProfile, useSubjectAssignments } from "@/lib/staff/queries";
import { useCreateResultBatch } from "@/lib/results/queries";
import { ApiError } from "@/lib/api/errors";

/** Teacher flow: pick from the subject-teacher assignments already granted
 * to them (Module 04) — never a free choice of class/subject. */
function TeacherCreateForm() {
  const router = useRouter();
  const myProfileQuery = useMyStaffProfile();
  const staffId = myProfileQuery.data?.id ?? 0;
  const assignmentsQuery = useSubjectAssignments(staffId);
  const createBatch = useCreateResultBatch();

  const [assignmentKey, setAssignmentKey] = useState("");
  const [termId, setTermId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // All hooks must run unconditionally on every render, so these are
  // computed before any early return below (even though they're only
  // meaningful once the profile/assignments queries have resolved).
  const assignments = assignmentsQuery.data ?? [];
  const selected = assignments.find((a) => String(a.id) === assignmentKey);
  const termsQuery = useTerms(selected?.academic_session.id ?? 0);

  if (myProfileQuery.isPending) return <LoadingState label="Loading your profile…" />;
  if (myProfileQuery.isError) {
    return (
      <p className="text-sm text-muted-foreground">
        You don&apos;t have a staff profile linked to your account, so there are no subject
        assignments to create a result batch from.
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!selected || !termId) return;
    setFormError(null);
    try {
      const batch = await createBatch.mutateAsync({
        academic_session_id: selected.academic_session.id,
        term_id: Number(termId),
        class_id: selected.class.id,
        section_id: null,
        subject_id: selected.subject.id,
      });
      router.push(`/results/${batch.id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  if (assignmentsQuery.isPending) return <LoadingState label="Loading your assignments…" />;
  if (assignmentsQuery.isError) return <ErrorState error={assignmentsQuery.error} />;
  if (assignments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        You have no subject-teacher assignments yet. Ask an administrator to assign you to a
        class and subject before creating a result batch.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="assignment">Class &amp; subject</Label>
        <Select
          id="assignment"
          value={assignmentKey}
          onChange={(e) => {
            setAssignmentKey(e.target.value);
            setTermId("");
          }}
        >
          <option value="">Select…</option>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.class.name} · {a.subject.name} ({a.academic_session.name})
            </option>
          ))}
        </Select>
      </div>
      {selected && (
        <div className="space-y-2">
          <Label htmlFor="term">Term</Label>
          <Select id="term" value={termId} onChange={(e) => setTermId(e.target.value)}>
            <option value="">Select a term…</option>
            {termsQuery.data?.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <Button type="submit" disabled={!selected || !termId || createBatch.isPending}>
        {createBatch.isPending ? "Creating…" : "Create result batch"}
      </Button>
    </form>
  );
}

/** Admin/registrar flow: full manual context selection, for oversight. */
function AdminCreateForm() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState("");
  const [termId, setTermId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sessionsQuery = useAcademicSessions(1);
  const termsQuery = useTerms(sessionId ? Number(sessionId) : 0);
  const classesQuery = useClasses(1);
  const classDetailQuery = useClassDetail(classId ? Number(classId) : 0);
  const createBatch = useCreateResultBatch();

  const sections = classId ? classDetailQuery.data?.sections ?? [] : [];
  const subjects = classId ? classDetailQuery.data?.subjects ?? [] : [];

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!sessionId || !termId || !classId || !subjectId) return;
    setFormError(null);
    try {
      const batch = await createBatch.mutateAsync({
        academic_session_id: Number(sessionId),
        term_id: Number(termId),
        class_id: Number(classId),
        section_id: sectionId ? Number(sectionId) : null,
        subject_id: Number(subjectId),
      });
      router.push(`/results/${batch.id}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="session">Academic session</Label>
        <Select
          id="session"
          value={sessionId}
          onChange={(e) => {
            setSessionId(e.target.value);
            setTermId("");
          }}
        >
          <option value="">Select a session…</option>
          {sessionsQuery.data?.data.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>
      {sessionId && (
        <div className="space-y-2">
          <Label htmlFor="term">Term</Label>
          <Select id="term" value={termId} onChange={(e) => setTermId(e.target.value)}>
            <option value="">Select a term…</option>
            {termsQuery.data?.map((term) => (
              <option key={term.id} value={term.id}>
                {term.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="class">Class</Label>
        <Select
          id="class"
          value={classId}
          onChange={(e) => {
            setClassId(e.target.value);
            setSectionId("");
            setSubjectId("");
          }}
        >
          <option value="">Select a class…</option>
          {classesQuery.data?.data.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      {classId && sections.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="section">Section (optional — leave blank for whole class)</Label>
          <Select id="section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
            <option value="">Whole class</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
      )}
      {classId && (
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">This class has no subjects assigned yet.</p>
          ) : (
            <Select id="subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Select a subject…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      )}
      <Button type="submit" disabled={!sessionId || !termId || !classId || !subjectId || createBatch.isPending}>
        {createBatch.isPending ? "Creating…" : "Create result batch"}
      </Button>
    </form>
  );
}

export default function NewResultBatchPage() {
  const { user } = useAuth();

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to results
        </Link>
        <h1 className="mt-1 text-lg font-semibold">New result batch</h1>
        <p className="text-sm text-muted-foreground">
          This will load the class roster so you can begin entering scores.
        </p>
      </div>
      <AdminOnly check={canAccessResults} description="Only authorized staff can create result batches.">
        {user?.role === "staff" ? <TeacherCreateForm /> : <AdminCreateForm />}
      </AdminOnly>
    </main>
  );
}

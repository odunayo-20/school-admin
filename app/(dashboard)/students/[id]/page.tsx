"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EnrollDialog } from "@/components/students/enroll-dialog";
import { GuardianFormDialog } from "@/components/students/guardian-form";
import { PromoteDialog } from "@/components/promotions/promote-dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { canManagePromotions, canManageStudents } from "@/lib/auth/permissions";
import { useAuth } from "@/lib/auth/context";
import {
  useCreateGuardian,
  useDeleteGuardian,
  useStudent,
  useUpdateGuardian,
  useUpdateStudentStatus,
} from "@/lib/students/queries";
import { useStudentEnrollments, useUpdateEnrollmentStatus } from "@/lib/enrollment/queries";
import { useStudentResults } from "@/lib/results/queries";
import { useStudentPromotions } from "@/lib/promotions/queries";
import type { Guardian, StudentStatus } from "@/lib/students/types";
import type { PromotionDecision } from "@/lib/promotions/types";

const PROMOTION_DECISION_LABELS: Record<PromotionDecision, string> = {
  promote: "Promoted",
  repeat: "Repeated",
  graduate: "Graduated",
};

const STATUS_LABELS: Record<StudentStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  graduated: "Graduated",
  withdrawn: "Withdrawn",
};

function StatusChanger({ studentId, currentStatus }: { studentId: number; currentStatus: StudentStatus }) {
  const [selected, setSelected] = useState<StudentStatus>(currentStatus);
  const updateStatus = useUpdateStudentStatus(studentId);

  function handleChange() {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this student's status to "${STATUS_LABELS[selected]}"? This may affect their access and academic records.`
      )
    ) {
      setSelected(currentStatus);
      return;
    }
    updateStatus.mutate(selected);
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        className="w-36"
        value={selected}
        onChange={(e) => setSelected(e.target.value as StudentStatus)}
      >
        {(Object.keys(STATUS_LABELS) as StudentStatus[]).map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Button
        variant="outline"
        size="sm"
        disabled={selected === currentStatus || updateStatus.isPending}
        onClick={handleChange}
      >
        {updateStatus.isPending ? "Updating…" : "Update status"}
      </Button>
    </div>
  );
}

function GuardianRow({ studentId, guardian }: { studentId: number; guardian: Guardian }) {
  const [editing, setEditing] = useState(false);
  const updateGuardian = useUpdateGuardian(studentId);
  const deleteGuardian = useDeleteGuardian(studentId);

  return (
    <li className="flex items-center justify-between px-3 py-2 text-sm">
      <div>
        <span className="font-medium">{guardian.name}</span>{" "}
        <span className="text-muted-foreground capitalize">({guardian.relationship})</span>
        <p className="text-muted-foreground">
          {guardian.phone ?? "—"} {guardian.email ? `· ${guardian.email}` : ""}
        </p>
      </div>
      <span className="flex shrink-0 gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleteGuardian.isPending}
          onClick={() => {
            if (window.confirm(`Remove ${guardian.name} as a guardian for this student?`)) {
              deleteGuardian.mutate(guardian.id);
            }
          }}
          aria-label={`Remove ${guardian.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </span>
      <GuardianFormDialog
        open={editing}
        onOpenChange={setEditing}
        guardian={guardian}
        mutateAsync={(data) => updateGuardian.mutateAsync({ id: guardian.id, data })}
        isPending={updateGuardian.isPending}
      />
    </li>
  );
}

function EnrollmentHistory({ studentId }: { studentId: number }) {
  const enrollmentsQuery = useStudentEnrollments(studentId);
  const updateEnrollmentStatus = useUpdateEnrollmentStatus(studentId);

  if (enrollmentsQuery.isPending) return <LoadingState label="Loading enrollment history…" />;
  if (enrollmentsQuery.isError) {
    return <ErrorState error={enrollmentsQuery.error} onRetry={() => enrollmentsQuery.refetch()} />;
  }
  if (enrollmentsQuery.data.length === 0) {
    return <p className="text-sm text-muted-foreground">No enrollment history.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {enrollmentsQuery.data.map((enrollment) => (
        <li key={enrollment.id} className="flex items-center justify-between px-3 py-2 text-sm">
          <span>
            {enrollment.class.name}
            {enrollment.section ? ` – ${enrollment.section.name}` : ""}{" "}
            <span className="text-muted-foreground">({enrollment.academic_session.name})</span>
          </span>
          <span className="flex items-center gap-2">
            {enrollment.status === "active" ? (
              <Badge>Active</Badge>
            ) : (
              <Badge variant="outline">{enrollment.status[0].toUpperCase() + enrollment.status.slice(1)}</Badge>
            )}
            {enrollment.status === "active" && (
              <Button
                variant="ghost"
                size="sm"
                disabled={updateEnrollmentStatus.isPending}
                onClick={() => {
                  if (window.confirm(`Withdraw this student from ${enrollment.class.name}?`)) {
                    updateEnrollmentStatus.mutate({ id: enrollment.id, status: "withdrawn" });
                  }
                }}
              >
                Withdraw
              </Button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Published results only — this reads the same list Module 06 manages,
 * never draft/unpublished data (see lib/results). */
function StudentResults({ studentId }: { studentId: number }) {
  const resultsQuery = useStudentResults(studentId);

  if (resultsQuery.isPending) return <LoadingState label="Loading results…" />;
  if (resultsQuery.isError) return <ErrorState error={resultsQuery.error} onRetry={() => resultsQuery.refetch()} />;
  if (resultsQuery.data.length === 0) {
    return <EmptyState title="No published results yet." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Session / Term</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Remark</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {resultsQuery.data.map((result) => (
          <TableRow key={result.id}>
            <TableCell>
              {result.academic_session.name} · {result.term.name}
            </TableCell>
            <TableCell className="font-medium">{result.subject.name}</TableCell>
            <TableCell>{result.total_score ?? "—"}</TableCell>
            <TableCell>{result.grade ? <Badge variant="outline">{result.grade}</Badge> : "—"}</TableCell>
            <TableCell className="text-muted-foreground">{result.remark ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Promotion history — audit log of past promote/repeat/graduate decisions
 * for this student (see lib/promotions). */
function PromotionHistory({ studentId }: { studentId: number }) {
  const promotionsQuery = useStudentPromotions(studentId);

  if (promotionsQuery.isPending) return <LoadingState label="Loading promotion history…" />;
  if (promotionsQuery.isError) {
    return <ErrorState error={promotionsQuery.error} onRetry={() => promotionsQuery.refetch()} />;
  }
  if (promotionsQuery.data.length === 0) {
    return <p className="text-sm text-muted-foreground">No promotion history yet.</p>;
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border bg-card">
      {promotionsQuery.data.map((record) => (
        <li key={record.id} className="flex items-center justify-between px-3 py-2 text-sm">
          <span>
            {PROMOTION_DECISION_LABELS[record.decision]}: {record.from_class.name}
            {record.from_section ? ` - ${record.from_section.name}` : ""}
            {record.to_class && (
              <>
                {" → "}
                {record.to_class.name}
                {record.to_section ? ` - ${record.to_section.name}` : ""}
              </>
            )}{" "}
            <span className="text-muted-foreground">({new Date(record.promoted_at).toLocaleDateString()})</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function StudentDetailContent({ studentId }: { studentId: number }) {
  const { user } = useAuth();
  const studentQuery = useStudent(studentId);
  const createGuardian = useCreateGuardian(studentId);
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);

  if (studentQuery.isPending) return <LoadingState label="Loading student…" />;
  if (studentQuery.isError) return <ErrorState error={studentQuery.error} onRetry={() => studentQuery.refetch()} />;

  const student = studentQuery.data;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{student.name}</h2>
            {student.status === "active" ? <Badge>Active</Badge> : <Badge variant="outline">{STATUS_LABELS[student.status]}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">
            Student no: {student.student_no}
            {student.current_enrollment && (
              <>
                {" "}
                · {student.current_enrollment.class.name}
                {student.current_enrollment.section ? ` - ${student.current_enrollment.section.name}` : ""}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/students/${studentId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Edit
          </Link>
          <StatusChanger studentId={studentId} currentStatus={student.status} />
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Personal information</h2>
        <dl className="grid gap-1 text-sm sm:max-w-md">
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Date of birth</dt>
            <dd>{student.date_of_birth ?? "—"}</dd>
          </div>
          <div className="flex justify-between border-b border-border py-1.5">
            <dt className="text-muted-foreground">Gender</dt>
            <dd className="capitalize">{student.gender ?? "—"}</dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Guardians</h2>
          <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add guardian
          </Button>
        </div>
        {student.guardians.length === 0 ? (
          <EmptyState title="No guardians recorded." description="Add at least one guardian for this student." />
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {student.guardians.map((guardian) => (
              <GuardianRow key={guardian.id} studentId={studentId} guardian={guardian} />
            ))}
          </ul>
        )}
        <GuardianFormDialog
          open={guardianDialogOpen}
          onOpenChange={setGuardianDialogOpen}
          mutateAsync={(data) => createGuardian.mutateAsync(data)}
          isPending={createGuardian.isPending}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Enrollment</h2>
          <Button size="sm" variant="outline" onClick={() => setEnrollDialogOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Enroll
          </Button>
        </div>
        <EnrollmentHistory studentId={studentId} />
        <EnrollDialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen} studentId={studentId} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Promotion</h2>
          {user && canManagePromotions(user.role) && student.status === "active" && student.current_enrollment && (
            <Button size="sm" variant="outline" onClick={() => setPromoteDialogOpen(true)}>
              Promote
            </Button>
          )}
        </div>
        <PromotionHistory studentId={studentId} />
        {student.current_enrollment && (
          <PromoteDialog
            open={promoteDialogOpen}
            onOpenChange={setPromoteDialogOpen}
            studentId={studentId}
            studentName={student.name}
            currentEnrollment={student.current_enrollment}
          />
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Results</h2>
        <StudentResults studentId={studentId} />
      </section>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/students" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to students
      </Link>
      <AdminOnly
        check={canManageStudents}
        description="Student profiles are only visible to administrators and registrars."
      >
        <StudentDetailContent studentId={studentId} />
      </AdminOnly>
    </main>
  );
}

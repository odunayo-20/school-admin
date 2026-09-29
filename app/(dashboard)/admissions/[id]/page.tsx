"use client";

import { use, useState } from "react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { canManageAdmissions } from "@/lib/auth/permissions";
import {
  useAdmission,
  useApproveAdmission,
  useRejectAdmission,
} from "@/lib/admissions/queries";
import { ApiError } from "@/lib/api/errors";

function AdmissionDetailContent({ admissionId }: { admissionId: number }) {
  const admissionQuery = useAdmission(admissionId);
  const approveAdmission = useApproveAdmission(admissionId);
  const rejectAdmission = useRejectAdmission(admissionId);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approvedStudentId, setApprovedStudentId] = useState<number | null>(null);

  if (admissionQuery.isPending) return <LoadingState label="Loading admission…" />;
  if (admissionQuery.isError) {
    return <ErrorState error={admissionQuery.error} onRetry={() => admissionQuery.refetch()} />;
  }

  const admission = admissionQuery.data;

  async function handleApprove() {
    if (
      !window.confirm(
        `Approve ${admission.applicant_name}'s application? This will create a student record for them.`
      )
    ) {
      return;
    }
    setActionError(null);
    try {
      const result = await approveAdmission.mutateAsync();
      setApprovedStudentId(result.student.id);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  async function handleReject() {
    if (
      !window.confirm(`Reject ${admission.applicant_name}'s application? This cannot be undone.`)
    ) {
      return;
    }
    setActionError(null);
    try {
      await rejectAdmission.mutateAsync();
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  const studentId = admission.student_id ?? approvedStudentId;

  return (
    <div className="space-y-8">
      {actionError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{admission.applicant_name}</h2>
            {admission.status === "approved" && <Badge>Approved</Badge>}
            {admission.status === "rejected" && <Badge variant="outline">Rejected</Badge>}
            {admission.status === "pending" && <Badge variant="outline">Pending</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Admission no: {admission.admission_no}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {admission.status === "pending" && (
            <>
              <Link
                href={`/admissions/${admissionId}/edit`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Edit
              </Link>
              <Button
                variant="outline"
                size="sm"
                disabled={rejectAdmission.isPending}
                onClick={handleReject}
              >
                Reject
              </Button>
              <Button size="sm" disabled={approveAdmission.isPending} onClick={handleApprove}>
                {approveAdmission.isPending ? "Approving…" : "Approve"}
              </Button>
            </>
          )}
          {studentId && (
            <Link href={`/students/${studentId}`} className={buttonVariants({ size: "sm" })}>
              View student profile
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Applicant information</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Date of birth</dt>
              <dd>{admission.date_of_birth ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Gender</dt>
              <dd className="capitalize">{admission.gender ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Application date</dt>
              <dd>{admission.application_date}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Academic information</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Intended class</dt>
              <dd>{admission.intended_class?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Previous school</dt>
              <dd>{admission.previous_school ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Guardian information</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{admission.guardian_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{admission.guardian_phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{admission.guardian_email ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}

export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const admissionId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/admissions" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to admissions
      </Link>
      <AdminOnly
        check={canManageAdmissions}
        description="Admission records are only visible to administrators and registrars."
      >
        <AdmissionDetailContent admissionId={admissionId} />
      </AdminOnly>
    </main>
  );
}

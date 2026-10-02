"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  GraduationCap,
  Sparkles,
  User,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { canManageAdmissions } from "@/lib/auth/permissions";
import {
  useAdmission,
  useAdmitAdmission,
  useRejectAdmission,
  useWithdrawAdmission,
} from "@/lib/admissions/queries";
import { ApiError } from "@/lib/api/errors";
import type { Admission, AdmissionStatus } from "@/lib/admissions/types";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: AdmissionStatus | string }) {
  const norm = (status || "PENDING").toUpperCase();

  switch (norm) {
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Pending Decision
        </span>
      );
    case "ADMITTED":
    case "APPROVED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Admitted
        </span>
      );
    case "REJECTED":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/25 bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
          <XCircle className="h-3.5 w-3.5" />
          Rejected
        </span>
      );
    case "WITHDRAWN":
      return (
        <span className="inline-flex items-center rounded-full border border-muted-foreground/30 bg-muted/40 px-3 py-1 text-xs font-semibold text-muted-foreground">
          Withdrawn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
          {status}
        </span>
      );
  }
}

function getInitials(name: string): string {
  if (!name) return "AD";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function calculateAge(dateOfBirth?: string | null): string {
  if (!dateOfBirth) return "—";
  const dob = new Date(dateOfBirth);
  if (isNaN(dob.getTime())) return "—";
  const diff = Date.now() - dob.getTime();
  const age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} years old`;
}

function AdmissionDetailContent({ admissionId }: { admissionId: number }) {
  const admissionQuery = useAdmission(admissionId);
  const admitMutation = useAdmitAdmission(admissionId);
  const rejectMutation = useRejectAdmission(admissionId);
  const withdrawMutation = useWithdrawAdmission(admissionId);

  const [actionError, setActionError] = useState<string | null>(null);

  // Dialog states
  const [isAdmitOpen, setIsAdmitOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [decisionNotes, setDecisionNotes] = useState("");

  if (admissionQuery.isPending) return <LoadingState label="Loading application profile…" />;
  if (admissionQuery.isError) {
    return <ErrorState error={admissionQuery.error} onRetry={() => admissionQuery.refetch()} />;
  }

  const admission = admissionQuery.data;
  const fullName = admission.full_name || admission.applicant_name || "Applicant";
  const initials = getInitials(fullName);
  const statusUpper = (admission.status || "PENDING").toUpperCase();
  const isPending = statusUpper === "PENDING";
  const isAdmitted = statusUpper === "ADMITTED" || statusUpper === "APPROVED";
  const isRejected = statusUpper === "REJECTED";
  const isWithdrawn = statusUpper === "WITHDRAWN";

  const studentId = admission.student?.id ?? admission.student_id;

  async function handleAdmit() {
    setActionError(null);
    try {
      await admitMutation.mutateAsync();
      setIsAdmitOpen(false);
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Failed to admit applicant.");
    }
  }

  async function handleReject() {
    setActionError(null);
    try {
      await rejectMutation.mutateAsync(decisionNotes);
      setIsRejectOpen(false);
      setDecisionNotes("");
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Failed to reject application.");
    }
  }

  async function handleWithdraw() {
    setActionError(null);
    try {
      await withdrawMutation.mutateAsync(decisionNotes);
      setIsWithdrawOpen(false);
      setDecisionNotes("");
    } catch (error) {
      setActionError(error instanceof ApiError ? error.message : "Failed to withdraw application.");
    }
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {actionError}
        </div>
      )}

      {/* Hero Header Card */}
      <div className="rounded-xl border border-border/70 bg-card p-6 shadow-xs">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{fullName}</h1>
                <StatusBadge status={admission.status} />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-2 py-0.5 rounded font-medium text-foreground">
                  {admission.admission_number || admission.admission_no || `ADM-${admission.id}`}
                </span>
                <span>•</span>
                <span>Intake: {admission.academic_session?.name || "Target Session"}</span>
                <span>•</span>
                <span>Level: {admission.entry_class_level?.name || "General"}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {isPending && (
              <>
                <Link
                  href={`/admissions/${admissionId}/edit`}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDecisionNotes("");
                    setIsWithdrawOpen(true);
                  }}
                  className="gap-1.5"
                >
                  Withdraw
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDecisionNotes("");
                    setIsRejectOpen(true);
                  }}
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAdmitOpen(true)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Admit Applicant
                </Button>
              </>
            )}

            {isAdmitted && studentId && (
              <Link
                href={`/students/${studentId}`}
                className={cn(buttonVariants({ size: "sm" }), "gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white")}
              >
                <span>View Student Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Linked Student Banner (When Admitted) */}
      {isAdmitted && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 shadow-xs">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                  Candidate Admitted — Student Record Created
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-200">
                  Official student roll profile is active. You can now place this student into an academic session, class, and section/arm.
                </p>
              </div>
            </div>
            {studentId && (
              <Link
                href={`/students/${studentId}`}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "shrink-0 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                )}
              >
                <span>Enroll into Class & Arm</span>
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Rejection / Withdrawal Notice (When Declined or Withdrawn) */}
      {(isRejected || isWithdrawn) && (
        <div
          className={cn(
            "rounded-xl border p-5 shadow-xs",
            isRejected
              ? "border-destructive/30 bg-destructive/10"
              : "border-muted-foreground/30 bg-muted/40"
          )}
        >
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                isRejected ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
              )}
            >
              {isRejected ? <XCircle className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">
                {isRejected ? "Application Declined" : "Application Withdrawn"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {isRejected
                  ? "This applicant was reviewed and not accepted for this intake session."
                  : "This application was withdrawn prior to admission approval."}
                {admission.decided_at && (
                  <span> Decision date: {new Date(admission.decided_at).toLocaleDateString()}.</span>
                )}
              </p>
              {admission.notes && (
                <div className="mt-2 text-xs rounded-lg border border-border/60 bg-card p-3 text-foreground">
                  <span className="font-semibold">Recorded Remarks: </span>
                  {admission.notes}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Details Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Applicant Personal Information */}
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <User className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Applicant Identification</h2>
              <p className="text-xs text-muted-foreground">Verified candidate identity snapshot</p>
            </div>
          </div>

          <dl className="divide-y divide-border/60 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Full Name</dt>
              <dd className="font-medium text-foreground">{fullName}</dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">First Name</dt>
              <dd className="font-medium text-foreground">{admission.first_name}</dd>
            </div>
            {admission.middle_name && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Middle Name</dt>
                <dd className="font-medium text-foreground">{admission.middle_name}</dd>
              </div>
            )}
            {admission.last_name && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Last / Family Name</dt>
                <dd className="font-medium text-foreground">{admission.last_name}</dd>
              </div>
            )}
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Date of Birth</dt>
              <dd className="font-medium text-foreground">
                {admission.date_of_birth ? `${admission.date_of_birth} (${calculateAge(admission.date_of_birth)})` : "Not specified"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Gender</dt>
              <dd className="font-medium text-foreground capitalize">
                {admission.gender ? admission.gender.toLowerCase() : "Not specified"}
              </dd>
            </div>
          </dl>
        </section>

        {/* Target Intake & Academic Placement */}
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Intake & Placement Target</h2>
              <p className="text-xs text-muted-foreground">Session and entry criteria</p>
            </div>
          </div>

          <dl className="divide-y divide-border/60 text-sm">
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Target Session</dt>
              <dd className="font-medium text-foreground">
                {admission.academic_session?.name || "—"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Desired Class Level</dt>
              <dd className="font-medium text-foreground">
                {admission.entry_class_level?.name || admission.intended_class?.name || "General Intake"}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Admission Reference</dt>
              <dd className="font-mono text-xs font-semibold text-foreground">
                {admission.admission_number || admission.admission_no || `ADM-${admission.id}`}
              </dd>
            </div>
            <div className="flex justify-between py-2.5">
              <dt className="text-muted-foreground">Application Date</dt>
              <dd className="font-medium text-foreground">
                {admission.created_at ? new Date(admission.created_at).toLocaleDateString() : admission.application_date || "—"}
              </dd>
            </div>
            {admission.decided_at && (
              <div className="flex justify-between py-2.5">
                <dt className="text-muted-foreground">Decision Date</dt>
                <dd className="font-medium text-foreground">
                  {new Date(admission.decided_at).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {/* Evaluation & Historical Notes */}
        <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Evaluation Notes & Audit Remarks</h2>
              <p className="text-xs text-muted-foreground">Intake notes, interview remarks, or previous academic background</p>
            </div>
          </div>

          <div className="space-y-3">
            {admission.notes ? (
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm text-foreground whitespace-pre-wrap">
                {admission.notes}
              </div>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                No evaluation notes or remarks have been recorded for this application.
              </p>
            )}

            {/* Previous school or guardian info if present */}
            {(admission.previous_school || admission.guardian_name || admission.guardian_phone || admission.guardian_email) && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/50 text-xs">
                {admission.previous_school && (
                  <div>
                    <span className="text-muted-foreground">Previous School: </span>
                    <span className="font-medium text-foreground">{admission.previous_school}</span>
                  </div>
                )}
                {admission.guardian_name && (
                  <div>
                    <span className="text-muted-foreground">Guardian: </span>
                    <span className="font-medium text-foreground">
                      {admission.guardian_name} {admission.guardian_phone ? `(${admission.guardian_phone})` : ""}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Admit Dialog Confirmation */}
      <Dialog open={isAdmitOpen} onOpenChange={setIsAdmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 mb-2">
              <UserCheck className="h-5 w-5" />
            </div>
            <DialogTitle>Admit {fullName}?</DialogTitle>
            <DialogDescription className="text-xs space-y-2 pt-1">
              <span>
                Admitting this applicant will immediately generate an official, persistent student record in the school database with a unique student registration number.
              </span>
              <span className="block font-medium text-foreground">
                This operation is terminal and cannot be reversed.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAdmitOpen(false)}
              disabled={admitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAdmit}
              disabled={admitMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {admitMutation.isPending ? "Admitting…" : "Confirm & Admit Applicant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog Confirmation */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-2">
              <UserX className="h-5 w-5" />
            </div>
            <DialogTitle>Decline {fullName}&apos;s Application?</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              This will decline the admission application. You can optionally include an explanatory note for the school audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="reject-notes" className="text-xs font-medium text-foreground">
              Decline Reason / Remarks (Optional)
            </label>
            <textarea
              id="reject-notes"
              rows={3}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g. Did not meet minimum entrance requirements or class capacity reached…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Declining…" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdraw Dialog Confirmation */}
      <Dialog open={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-2">
              <Clock className="h-5 w-5" />
            </div>
            <DialogTitle>Mark Application as Withdrawn?</DialogTitle>
            <DialogDescription className="text-xs pt-1">
              Record that the applicant or guardian requested withdrawal prior to a formal decision.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label htmlFor="withdraw-notes" className="text-xs font-medium text-foreground">
              Withdrawal Reason / Remarks (Optional)
            </label>
            <textarea
              id="withdraw-notes"
              rows={3}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="e.g. Guardian relocated or chose another institution…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWithdrawOpen(false)}
              disabled={withdrawMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleWithdraw}
              disabled={withdrawMutation.isPending}
            >
              {withdrawMutation.isPending ? "Saving…" : "Mark Withdrawn"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdmissionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const admissionId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <div>
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admissions queue
        </Link>
      </div>

      <AdminOnly
        check={canManageAdmissions}
        description="Admission records are only visible to administrators and registrars."
      >
        <AdmissionDetailContent admissionId={admissionId} />
      </AdminOnly>
    </main>
  );
}

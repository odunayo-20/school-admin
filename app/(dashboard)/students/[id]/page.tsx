"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  FileText,
  GraduationCap,
  Layers,
  Mail,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EnrollDialog } from "@/components/students/enroll-dialog";
import { GuardianFormDialog } from "@/components/students/guardian-form";
import { PromoteDialog } from "@/components/promotions/promote-dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { cn } from "@/lib/utils";

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

function StatusBadge({ status }: { status: StudentStatus | string }) {
  const normalized = (status || "active").toLowerCase();

  switch (normalized) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      );
    case "graduated":
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/25 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
          <GraduationCap className="h-3 w-3" />
          Graduated
        </span>
      );
    case "inactive":
      return (
        <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
          Inactive
        </span>
      );
    case "withdrawn":
      return (
        <span className="inline-flex items-center rounded-full border border-destructive/25 bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
          Withdrawn
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground capitalize">
          {status}
        </span>
      );
  }
}

function getInitials(name: string): string {
  if (!name) return "ST";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function StatusChanger({
  studentId,
  currentStatus,
}: {
  studentId: number;
  currentStatus: StudentStatus;
}) {
  const [selected, setSelected] = useState<StudentStatus>(currentStatus);
  const updateStatus = useUpdateStudentStatus(studentId);

  async function handleChange() {
    if (selected === currentStatus) return;
    if (
      !window.confirm(
        `Change this student's status to "${STATUS_LABELS[selected]}"? This may update their roll standing.`
      )
    ) {
      setSelected(currentStatus);
      return;
    }
    try {
      await updateStatus.mutateAsync(selected);
    } catch {
      setSelected(currentStatus);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        id="student-status-select"
        className="h-8 w-32 text-xs"
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
        className="h-8 text-xs"
      >
        {updateStatus.isPending ? "Updating…" : "Update"}
      </Button>
    </div>
  );
}

function GuardianRow({
  studentId,
  guardian,
}: {
  studentId: number;
  guardian: Guardian;
}) {
  const [editing, setEditing] = useState(false);
  const updateGuardian = useUpdateGuardian(studentId);
  const deleteGuardian = useDeleteGuardian(studentId);

  return (
    <li className="flex items-center justify-between p-4 text-xs transition-colors hover:bg-muted/30">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground text-sm">{guardian.name}</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">
            {guardian.relationship}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">
          {guardian.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              {guardian.phone}
            </span>
          )}
          {guardian.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3 w-3" />
              {guardian.email}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)} className="h-8 text-xs">
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
          className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
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

  if (enrollmentsQuery.isPending) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  const enrollments = enrollmentsQuery.data ?? [];

  if (enrollments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
          <Layers className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">No class placement history</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          This learner is not currently placed in any instructional class or arm.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="text-xs font-semibold">Class Placement</TableHead>
            <TableHead className="text-xs font-semibold">Session</TableHead>
            <TableHead className="text-xs font-semibold">Enrolled Date</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => {
            const className = enrollment.class?.name || enrollment.school_class?.name || "Class";
            const sessionName = enrollment.academic_session?.name || "Academic Session";
            const dateStr = enrollment.enrollment_date
              ? new Date(enrollment.enrollment_date).toLocaleDateString()
              : "—";

            return (
              <TableRow key={enrollment.id} className="transition-colors hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground text-xs">{className}</span>
                    {enrollment.section && (
                      <span className="rounded border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-foreground">
                        {enrollment.section.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{sessionName}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{dateStr}</TableCell>
                <TableCell>
                  {enrollment.status === "active" ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-xs capitalize">
                      {enrollment.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {enrollment.status === "active" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={updateEnrollmentStatus.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Withdraw this student from ${className}? This will archive the current placement.`
                          )
                        ) {
                          updateEnrollmentStatus.mutate({ id: enrollment.id, status: "withdrawn" });
                        }
                      }}
                      className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-7"
                    >
                      Withdraw
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function StudentResults({ studentId }: { studentId: number }) {
  const resultsQuery = useStudentResults(studentId);

  if (resultsQuery.isPending) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const results = resultsQuery.data ?? [];

  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
          <Award className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">No published academic results</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm">
          Approved term assessment results and cumulative scores will appear here once published by the academic office.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
      <Table>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="text-xs font-semibold">Session / Term</TableHead>
            <TableHead className="text-xs font-semibold">Subject</TableHead>
            <TableHead className="text-xs font-semibold">Total Score</TableHead>
            <TableHead className="text-xs font-semibold">Grade</TableHead>
            <TableHead className="text-xs font-semibold">Remark</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id} className="transition-colors hover:bg-muted/30">
              <TableCell className="text-xs text-foreground font-medium">
                {result.academic_session?.name} · {result.term?.name}
              </TableCell>
              <TableCell className="text-xs font-semibold text-foreground">
                {result.subject?.name}
              </TableCell>
              <TableCell className="text-xs font-mono font-medium">
                {result.total_score ?? "—"}
              </TableCell>
              <TableCell>
                {result.grade ? (
                  <Badge variant="outline" className="font-bold">
                    {result.grade}
                  </Badge>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {result.remark ?? "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PromotionHistory({ studentId }: { studentId: number }) {
  const promotionsQuery = useStudentPromotions(studentId);

  if (promotionsQuery.isPending) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const promotions = promotionsQuery.data ?? [];

  if (promotions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
          <Sparkles className="h-5 w-5" />
        </div>
        <p className="text-sm font-semibold text-foreground">No promotion records</p>
        <p className="mt-1 text-xs text-muted-foreground max-w-xs">
          Session-end progression decisions (promotion, repetition, or graduation) will be logged here.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
      {promotions.map((record) => (
        <li key={record.id} className="flex items-center justify-between p-4 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground capitalize">
                {PROMOTION_DECISION_LABELS[record.decision] || record.decision}
              </span>
              <span className="text-muted-foreground">
                {record.from_class?.name}
                {record.from_section ? ` (${record.from_section.name})` : ""}
                {record.to_class && (
                  <>
                    {" → "}
                    <strong className="text-foreground">{record.to_class.name}</strong>
                    {record.to_section ? ` (${record.to_section.name})` : ""}
                  </>
                )}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Processed on {new Date(record.promoted_at).toLocaleDateString()}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function StudentDetailContent({ studentId }: { studentId: number }) {
  const { user } = useAuth();
  const studentQuery = useStudent(studentId);
  const enrollmentsQuery = useStudentEnrollments(studentId);
  const createGuardian = useCreateGuardian(studentId);

  const [activeTab, setActiveTab] = useState<"overview" | "enrollments" | "results" | "promotions" | "guardians">("overview");
  const [guardianDialogOpen, setGuardianDialogOpen] = useState(false);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [promoteDialogOpen, setPromoteDialogOpen] = useState(false);

  // ── All hooks MUST be declared before any early returns ──
  const student = studentQuery.data ?? null;
  const enrollments = enrollmentsQuery.data ?? [];

  const rawEnrollment = useMemo(() => {
    if (!student) return undefined;
    return (
      student.current_enrollment ||
      enrollments.find((e) => e.status === "active") ||
      enrollments[0]
    );
  }, [student, enrollments]);

  const currentEnrollment = useMemo(() => {
    if (!rawEnrollment) return null;
    const resolvedClass =
      (rawEnrollment as any).class ||
      (rawEnrollment as any).school_class ||
      null;
    return {
      ...rawEnrollment,
      class: resolvedClass,
      school_class: resolvedClass,
    };
  }, [rawEnrollment]);

  // ── Early returns after all hooks ──
  if (studentQuery.isPending) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-border/70 bg-card p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (studentQuery.isError || !student) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h3 className="text-sm font-semibold text-destructive">Failed to load student profile</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested student could not be retrieved from the school database.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => studentQuery.refetch()}
          className="mt-4 text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  const displayName =
    student.full_name ||
    student.name ||
    [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(" ") ||
    "Learner Record";
  const displayNo = student.student_number || student.student_no || `STU-${student.id}`;

  const currentClassName = currentEnrollment?.class?.name || null;
  const currentSectionName = currentEnrollment?.section?.name || null;

  const guardians = student.guardians ?? [];

  return (
    <div className="space-y-6">
      {/* 1. STUDENT HERO PROFILE BANNER */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            {/* Learner Avatar */}
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 text-xl font-bold text-primary shadow-inner">
              {getInitials(displayName)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
                  {displayName}
                </h2>
                <StatusBadge status={student.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono font-semibold rounded bg-muted px-2 py-0.5 text-foreground">
                  {displayNo}
                </span>

                {currentClassName ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Layers className="h-3.5 w-3.5 text-purple-500" />
                    {currentClassName}
                    {currentSectionName && ` (${currentSectionName})`}
                  </span>
                ) : (
                  <span className="italic text-muted-foreground">Unallocated class</span>
                )}

                {student.gender && (
                  <span className="capitalize">· {student.gender}</span>
                )}

                {student.date_of_birth && (
                  <span>· Born {new Date(student.date_of_birth).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/students/${studentId}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Edit3 className="mr-1.5 h-3.5 w-3.5" />
              Edit Profile
            </Link>

            <StatusChanger studentId={studentId} currentStatus={student.status} />

            <Button
              size="sm"
              onClick={() => setEnrollDialogOpen(true)}
              className="text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Enroll in Class
            </Button>

            {user && canManagePromotions(user.role) && student.status === "active" && currentEnrollment && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPromoteDialogOpen(true)}
                className="text-xs text-purple-600 border-purple-500/30 hover:bg-purple-500/10"
              >
                <Sparkles className="mr-1.5 h-3.5 w-3.5 text-purple-500" />
                Promote
              </Button>
            )}
          </div>
        </div>

        {/* Quick Lifecycle Metric Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/50 pt-4 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/40 p-2.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Enrolled Class
            </span>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {currentClassName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Academic Arm
            </span>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {currentSectionName || "None"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Portal Account
            </span>
            <p className="mt-0.5 text-sm font-semibold text-foreground capitalize">
              {student.account_status || "No Account"}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-2.5">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              Registered Date
            </span>
            <p className="mt-0.5 text-sm font-semibold text-foreground">
              {student.created_at ? new Date(student.created_at).toLocaleDateString() : "Active Session"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. TABBED SEGMENTED NAVIGATION */}
      <div className="flex border-b border-border/70 overflow-x-auto gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-3.5 w-3.5" />
          Personal Info & Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("enrollments")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
            activeTab === "enrollments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="h-3.5 w-3.5" />
          Class Placements ({enrollments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("results")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
            activeTab === "results"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Award className="h-3.5 w-3.5" />
          Academic Results
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("promotions")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
            activeTab === "promotions"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Promotion History
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("guardians")}
          className={cn(
            "flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap",
            activeTab === "guardians"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Users className="h-3.5 w-3.5" />
          Guardians ({guardians.length})
        </button>
      </div>

      {/* 3. TAB CONTENT WORKSPACE */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Identity Card */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Learner Profile Record
              </h3>
              <Link
                href={`/students/${studentId}/edit`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Edit
              </Link>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Full Name</dt>
                <dd className="font-semibold text-foreground">{displayName}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Student ID / Number</dt>
                <dd className="font-mono font-medium text-foreground">{displayNo}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Gender</dt>
                <dd className="capitalize text-foreground font-medium">{student.gender ?? "Not specified"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Date of Birth</dt>
                <dd className="text-foreground font-medium">{student.date_of_birth ?? "Not recorded"}</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Lifecycle Status</dt>
                <dd><StatusBadge status={student.status} /></dd>
              </div>
            </dl>
          </div>

          {/* Academic Standing Card */}
          <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Academic Standing
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEnrollDialogOpen(true)}
                className="h-7 text-xs text-primary"
              >
                Enroll
              </Button>
            </div>

            <dl className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Current Placement</dt>
                <dd className="font-semibold text-foreground">
                  {currentClassName ? `${currentClassName} ${currentSectionName ? `(${currentSectionName})` : ""}` : "Unallocated"}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Total Placements</dt>
                <dd className="font-medium text-foreground">{enrollments.length} sessions logged</dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Admissions Source</dt>
                <dd className="text-foreground font-medium">
                  {student.admission_id ? `Admissions Entry #${student.admission_id}` : "Direct Registry"}
                </dd>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <dt className="text-muted-foreground">Portal Account</dt>
                <dd className="font-medium text-foreground capitalize">
                  {student.account_status ? `Active (${student.account_status})` : "Unprovisioned"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === "enrollments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Class Placements & Arms</h3>
              <p className="text-xs text-muted-foreground">
                Authoritative history of class and section assignments across academic sessions.
              </p>
            </div>
            <Button size="sm" onClick={() => setEnrollDialogOpen(true)} className="text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Enroll in Class
            </Button>
          </div>
          <EnrollmentHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "results" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Published Academic Results</h3>
              <p className="text-xs text-muted-foreground">
                Official scores, assessment grades, and term remarks approved by teaching staff.
              </p>
            </div>
            <Link
              href="/results"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Results Processing
            </Link>
          </div>
          <StudentResults studentId={studentId} />
        </div>
      )}

      {activeTab === "promotions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Progression & Promotion Audit</h3>
              <p className="text-xs text-muted-foreground">
                Audit trail of annual grade promotions, repeat decisions, and graduation milestones.
              </p>
            </div>
            {user && canManagePromotions(user.role) && student.status === "active" && currentEnrollment && (
              <Button size="sm" onClick={() => setPromoteDialogOpen(true)} className="text-xs">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                Process Promotion
              </Button>
            )}
          </div>
          <PromotionHistory studentId={studentId} />
        </div>
      )}

      {activeTab === "guardians" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Guardians & Emergency Contacts</h3>
              <p className="text-xs text-muted-foreground">
                Parents and primary contacts associated with this student.
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => setGuardianDialogOpen(true)} className="text-xs">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Add Guardian
            </Button>
          </div>

          {guardians.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 p-8 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-2">
                <Users className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">No guardians recorded</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                Add parent or guardian contact information for emergency notifications.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setGuardianDialogOpen(true)}
                className="mt-4 text-xs"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add First Guardian
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border/60 rounded-xl border border-border/70 bg-card overflow-hidden shadow-sm">
              {guardians.map((guardian) => (
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
        </div>
      )}

      {/* Modal Dialogs */}
      <EnrollDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        studentId={studentId}
      />

      {currentEnrollment && currentEnrollment.class && (
        <PromoteDialog
          open={promoteDialogOpen}
          onOpenChange={setPromoteDialogOpen}
          studentId={studentId}
          studentName={displayName}
          currentEnrollment={currentEnrollment as any}
        />
      )}
    </div>
  );
}

export default function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const studentId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/students"
          className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Students Directory
        </Link>
        <span>/</span>
        <span className="font-semibold text-foreground">Learner Profile</span>
      </div>

      <AdminOnly
        check={canManageStudents}
        description="Student profiles are only visible to authorized administrators and registrars."
      >
        <StudentDetailContent studentId={studentId} />
      </AdminOnly>
    </main>
  );
}

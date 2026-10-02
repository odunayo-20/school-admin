"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Calendar,
  ChevronRight,
  GraduationCap,
  KeyRound,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Power,
  Shield,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { SubjectTeacherAssignments } from "@/components/staff/subject-teacher-assignments";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/context";
import { canManageStaff, canManageStaffAccounts } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import {
  useActivateStaff,
  useDeactivateStaff,
  useStaffMember,
} from "@/lib/staff/queries";
import type { Staff } from "@/lib/staff/types";
import { ApiError } from "@/lib/api/errors";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function normalizeStatus(staff: Staff) {
  return (staff.status ?? "").toUpperCase();
}

const STAFF_TYPE_CONFIG = {
  TEACHING: {
    label: "Teaching staff",
    icon: GraduationCap,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-gradient-to-br from-violet-500/20 via-violet-500/10 to-violet-500/5",
    pill: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  NON_TEACHING: {
    label: "Non-teaching staff",
    icon: Briefcase,
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-gradient-to-br from-sky-500/20 via-sky-500/10 to-sky-500/5",
    pill: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  },
} as const;

function getStaffTypeConfig(type: string | undefined) {
  const key = (type ?? "").toUpperCase();
  return STAFF_TYPE_CONFIG[key as keyof typeof STAFF_TYPE_CONFIG] ?? STAFF_TYPE_CONFIG.NON_TEACHING;
}



// ── Deactivate Confirm Dialog ─────────────────────────────────────────────────

function DeactivateDialog({
  open,
  onOpenChange,
  staff,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: Staff;
}) {
  const deactivate = useDeactivateStaff(staff.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate staff member</DialogTitle>
          <DialogDescription>
            <strong>{staff.name ?? "This staff member"}</strong> will be marked as inactive. Their
            login account (if any) will remain active and they will still be able to sign in.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deactivate.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deactivate.isPending}
            onClick={async () => {
              await deactivate.mutateAsync();
              onOpenChange(false);
            }}
          >
            {deactivate.isPending ? "Deactivating…" : "Deactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/60 last:border-0">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 truncate">
          {value ?? <span className="italic text-muted-foreground font-normal">Not set</span>}
        </p>
      </div>
    </div>
  );
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border/70 bg-card p-6">
        <div className="flex items-start gap-5">
          <Skeleton className="h-20 w-20 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-36" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-xl border border-border/70 bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Staff Detail Content ──────────────────────────────────────────────────────

function StaffDetailContent({ staffId }: { staffId: number }) {
  const { user } = useAuth();
  const staffQuery = useStaffMember(staffId);
  const activate = useActivateStaff(staffId);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  if (staffQuery.isPending) return <ProfileSkeleton />;

  if (staffQuery.isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <h3 className="text-sm font-semibold text-destructive">Failed to load staff profile</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          The requested staff member could not be retrieved.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => staffQuery.refetch()}
          className="mt-4 text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  const staff = staffQuery.data;
  const canManageAccounts = user ? canManageStaffAccounts(user.role) : false;
  const staffStatus = normalizeStatus(staff);
  const isActive = staffStatus === "ACTIVE";
  const isTerminated = staffStatus === "TERMINATED";
  const typeConfig = getStaffTypeConfig(staff.staff_type);
  const TypeIcon = typeConfig.icon;
  const displayName = staff.name || "Unnamed staff member";
  const staffNumber = staff.staff_number ?? staff.staff_no ?? `#${staff.id}`;

  return (
    <div className="space-y-6">
      {/* ── Hero banner ── */}
      <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card p-6 shadow-sm">
        {/* Subtle background gradient */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(ellipse at top left, hsl(var(--primary)) 0%, transparent 70%)`,
          }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <div
              className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold shadow-inner ${typeConfig.bg} ${typeConfig.color}`}
            >
              {getInitials(displayName)}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-foreground">{displayName}</h2>
                {/* Status pill */}
                {isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                ) : isTerminated ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Terminated
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Inactive
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeConfig.pill}`}
                >
                  <TypeIcon className="h-3 w-3" />
                  {typeConfig.label}
                </span>
                <span className="font-mono rounded bg-muted px-2 py-0.5 text-foreground">
                  {staffNumber}
                </span>
                {staff.designation && (
                  <span className="text-muted-foreground">{staff.designation}</span>
                )}
              </div>

              {staff.employment_date && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(staff.employment_date).toLocaleDateString(undefined, { dateStyle: "long" })}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/staff/${staffId}/edit`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Link>

            {!isTerminated && (
              <>
                {isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activate.isPending}
                    onClick={() => setDeactivateDialogOpen(true)}
                  >
                    <Power className="h-3.5 w-3.5 text-amber-500" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={activate.isPending}
                    onClick={() => activate.mutate()}
                  >
                    <Power className="h-3.5 w-3.5 text-emerald-500" />
                    {activate.isPending ? "Activating…" : "Activate"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Detail grid ── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact information */}
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Contact information
          </h3>
          <InfoRow icon={Mail} label="Email address" value={staff.email} />
          <InfoRow icon={Phone} label="Phone number" value={staff.phone} />
        </div>

        {/* Employment information */}
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Employment
          </h3>
          <InfoRow
            icon={Briefcase}
            label="Designation"
            value={staff.designation}
          />
          <InfoRow
            icon={TypeIcon}
            label="Staff type"
            value={typeConfig.label}
          />
          <InfoRow
            icon={Calendar}
            label="Employment date"
            value={
              staff.employment_date
                ? new Date(staff.employment_date).toLocaleDateString(undefined, { dateStyle: "long" })
                : null
            }
          />
        </div>
      </div>

      {/* ── System account ── */}
      <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            System account
          </h3>
          {staff.email && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Login enabled
            </span>
          )}
        </div>

        {staff.email ? (
          <div className="flex items-center gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate">{staff.email}</p>
                <Badge variant="outline" className="text-[10px] font-medium uppercase tracking-wider">
                  {staff.account_status ?? "ACTIVE"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Linked system account · Signs in using this email address
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 rounded-xl border border-dashed border-border/80 px-4 py-3.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground shrink-0">
              <UserX className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">No login account</p>
              <p className="text-xs text-muted-foreground">
                Staff accounts are provisioned during registration with a verified user login.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── Teaching assignments (only for TEACHING staff) ── */}
      {(staff.staff_type ?? "").toUpperCase() === "TEACHING" || staff.is_teacher ? (
        <SubjectTeacherAssignments staffId={staffId} />
      ) : null}


      <DeactivateDialog
        open={deactivateDialogOpen}
        onOpenChange={setDeactivateDialogOpen}
        staff={staff}
      />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staffId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to staff directory
      </Link>

      <AdminOnly
        check={canManageStaff}
        description="Staff profiles are only visible to administrators and registrars."
      >
        <StaffDetailContent staffId={staffId} />
      </AdminOnly>
    </main>
  );
}

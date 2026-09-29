"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminOnly } from "@/components/auth/admin-only";
import { ClassTeacherAssignments } from "@/components/staff/class-teacher-assignments";
import { SubjectTeacherAssignments } from "@/components/staff/subject-teacher-assignments";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAuth } from "@/lib/auth/context";
import { canManageStaff, canManageStaffAccounts } from "@/lib/auth/permissions";
import type { UserRole } from "@/lib/auth/types";
import { useGrantStaffAccount, useStaffMember, useUpdateStaffStatus } from "@/lib/staff/queries";
import type { Staff } from "@/lib/staff/types";
import { ApiError } from "@/lib/api/errors";

const EMPLOYMENT_LABELS: Record<Staff["employment_type"], string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
};

// Deliberately excludes "admin"/"super_admin" — granting staff login access
// should never be able to hand out elevated app roles from this form.
const grantAccountSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  role: z.enum(["registrar", "staff"]),
});
type GrantAccountValues = z.infer<typeof grantAccountSchema>;

function GrantAccountDialog({
  open,
  onOpenChange,
  staffId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: number;
}) {
  const grantAccount = useGrantStaffAccount(staffId);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<GrantAccountValues>({
    resolver: zodResolver(grantAccountSchema),
    defaultValues: { email: "", role: "staff" },
  });

  async function onSubmit(values: GrantAccountValues) {
    setFormError(null);
    try {
      await grantAccount.mutateAsync(values as { email: string; role: UserRole });
      reset();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in grantAccountSchema.shape) {
            setError(field as keyof GrantAccountValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grant login access</DialogTitle>
          <DialogDescription>
            The staff member will receive an email to set their own password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="account-email">Login email</Label>
            <Input id="account-email" type="email" {...register("email")} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="account-role">Role</Label>
            <Select id="account-role" {...register("role")}>
              <option value="staff">Staff</option>
              <option value="registrar">Registrar</option>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={grantAccount.isPending}>
            {grantAccount.isPending ? "Granting…" : "Grant access"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StaffDetailContent({ staffId }: { staffId: number }) {
  const { user } = useAuth();
  const staffQuery = useStaffMember(staffId);
  const updateStatus = useUpdateStaffStatus(staffId);
  const [grantDialogOpen, setGrantDialogOpen] = useState(false);

  if (staffQuery.isPending) return <LoadingState label="Loading staff profile…" />;
  if (staffQuery.isError) return <ErrorState error={staffQuery.error} onRetry={() => staffQuery.refetch()} />;

  const staff = staffQuery.data;
  const canManageAccounts = user ? canManageStaffAccounts(user.role) : false;
  const nextStatus = staff.status === "active" ? "inactive" : "active";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-md border border-border bg-card p-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold">{staff.name}</h2>
            {staff.status === "active" ? <Badge>Active</Badge> : <Badge variant="outline">Inactive</Badge>}
            {staff.is_teacher && <Badge variant="outline">Teacher</Badge>}
          </div>
          <p className="text-sm text-muted-foreground">Staff ID: {staff.staff_no}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/staff/${staffId}/edit`} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Edit
          </Link>
          <Button
            variant="outline"
            size="sm"
            disabled={updateStatus.isPending}
            onClick={() => {
              if (
                nextStatus === "inactive" &&
                !window.confirm(
                  `Deactivate ${staff.name}? They will no longer appear as active staff.`
                )
              ) {
                return;
              }
              updateStatus.mutate(nextStatus);
            }}
          >
            {staff.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Contact information</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{staff.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Phone</dt>
              <dd>{staff.phone ?? "—"}</dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">Employment information</h2>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Designation</dt>
              <dd>{staff.designation ?? "—"}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Employment type</dt>
              <dd>{EMPLOYMENT_LABELS[staff.employment_type]}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-1.5">
              <dt className="text-muted-foreground">Date joined</dt>
              <dd>{staff.date_joined ?? "—"}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">System account</h2>
        {staff.account ? (
          <div className="flex items-center justify-between rounded-md border border-border bg-card px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{staff.account.email}</p>
              <p className="text-muted-foreground">Login access enabled</p>
            </div>
            <Badge variant="outline">{staff.account.role}</Badge>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border border-dashed border-border px-4 py-3 text-sm">
            <p className="text-muted-foreground">This staff member has no login access.</p>
            {canManageAccounts && (
              <Button size="sm" variant="outline" onClick={() => setGrantDialogOpen(true)}>
                Grant login access
              </Button>
            )}
          </div>
        )}
        <GrantAccountDialog open={grantDialogOpen} onOpenChange={setGrantDialogOpen} staffId={staffId} />
      </section>

      {staff.is_teacher && (
        <>
          <ClassTeacherAssignments staffId={staffId} />
          <SubjectTeacherAssignments staffId={staffId} />
        </>
      )}
    </div>
  );
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staffId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">
        ← Back to staff
      </Link>
      <AdminOnly check={canManageStaff} description="Staff profiles are only visible to administrators and registrars.">
        <StaffDetailContent staffId={staffId} />
      </AdminOnly>
    </main>
  );
}

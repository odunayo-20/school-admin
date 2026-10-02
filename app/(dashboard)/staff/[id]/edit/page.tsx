"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { StaffUpdateForm } from "@/components/staff/staff-form";
import { canManageStaff } from "@/lib/auth/permissions";
import { useStaffMember, useUpdateStaff } from "@/lib/staff/queries";

function EditStaffContent({ staffId }: { staffId: number }) {
  const router = useRouter();
  const staffQuery = useStaffMember(staffId);
  const updateStaff = useUpdateStaff(staffId);

  if (staffQuery.isPending) return <LoadingState label="Loading staff…" />;
  if (staffQuery.isError)
    return <ErrorState error={staffQuery.error} onRetry={() => staffQuery.refetch()} />;

  const staff = staffQuery.data;

  return (
    <StaffUpdateForm
      defaultValues={staff}
      mutateAsync={(data) => updateStaff.mutateAsync(data)}
      isPending={updateStaff.isPending}
      onSuccess={() => router.push(`/staff/${staffId}`)}
      onCancel={() => router.push(`/staff/${staffId}`)}
    />
  );
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staffId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <Link
        href={`/staff/${staffId}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to profile
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400">
          <Pencil className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Edit staff member</h1>
          <p className="text-xs text-muted-foreground">
            Name, email shown here are employment fields — login credentials are managed separately.
          </p>
        </div>
      </div>

      <AdminOnly
        check={canManageStaff}
        description="Only administrators and registrars can edit staff members."
      >
        <EditStaffContent staffId={staffId} />
      </AdminOnly>
    </main>
  );
}

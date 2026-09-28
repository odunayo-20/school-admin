"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { StaffForm } from "@/components/staff/staff-form";
import { canManageStaff } from "@/lib/auth/permissions";
import { useStaffMember, useUpdateStaff } from "@/lib/staff/queries";

function EditStaffContent({ staffId }: { staffId: number }) {
  const router = useRouter();
  const staffQuery = useStaffMember(staffId);
  const updateStaff = useUpdateStaff(staffId);

  if (staffQuery.isPending) return <LoadingState label="Loading staff…" />;
  if (staffQuery.isError) return <ErrorState error={staffQuery.error} onRetry={() => staffQuery.refetch()} />;

  const staff = staffQuery.data;

  return (
    <StaffForm
      defaultValues={staff}
      mutateAsync={(data) => updateStaff.mutateAsync(data)}
      isPending={updateStaff.isPending}
      submitLabel="Save changes"
      onSuccess={() => router.push(`/staff/${staffId}`)}
      onCancel={() => router.push(`/staff/${staffId}`)}
    />
  );
}

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const staffId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href={`/staff/${staffId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to profile
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Edit staff</h1>
      </div>
      <AdminOnly check={canManageStaff} description="Only administrators and registrars can edit staff.">
        <EditStaffContent staffId={staffId} />
      </AdminOnly>
    </main>
  );
}

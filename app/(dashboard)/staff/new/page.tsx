"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { StaffForm } from "@/components/staff/staff-form";
import { canManageStaff } from "@/lib/auth/permissions";
import { useCreateStaff } from "@/lib/staff/queries";

export default function NewStaffPage() {
  const router = useRouter();
  const createStaff = useCreateStaff();

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href="/staff" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to staff
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Add staff</h1>
        <p className="text-sm text-muted-foreground">
          System login access can be granted afterwards from the staff profile.
        </p>
      </div>
      <AdminOnly check={canManageStaff} description="Only administrators and registrars can add staff.">
        <StaffForm
          mutateAsync={(data) => createStaff.mutateAsync(data)}
          isPending={createStaff.isPending}
          submitLabel="Create staff"
          onSuccess={(staff) => router.push(`/staff/${staff.id}`)}
          onCancel={() => router.push("/staff")}
        />
      </AdminOnly>
    </main>
  );
}

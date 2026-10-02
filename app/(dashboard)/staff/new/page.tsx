"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { StaffCreateForm } from "@/components/staff/staff-form";
import { canManageStaff } from "@/lib/auth/permissions";
import { useCreateStaff } from "@/lib/staff/queries";

export default function NewStaffPage() {
  const router = useRouter();
  const createStaff = useCreateStaff();

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to staff directory
      </Link>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600 dark:text-violet-400">
          <Users className="h-4 w-4" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Add staff member</h1>
          <p className="text-xs text-muted-foreground">
            A login account is created together with the staff record.
          </p>
        </div>
      </div>

      <AdminOnly
        check={canManageStaff}
        description="Only administrators and registrars can add staff members."
      >
        <StaffCreateForm
          mutateAsync={(data) => createStaff.mutateAsync(data)}
          isPending={createStaff.isPending}
          onSuccess={(staff) => router.push(`/staff/${staff.id}`)}
          onCancel={() => router.push("/staff")}
        />
      </AdminOnly>
    </main>
  );
}

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { AdmissionForm } from "@/components/admissions/admission-form";
import { canManageAdmissions } from "@/lib/auth/permissions";
import { useCreateAdmission } from "@/lib/admissions/queries";

export default function NewAdmissionPage() {
  const router = useRouter();
  const createAdmission = useCreateAdmission();

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href="/admissions" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to admissions
        </Link>
        <h1 className="mt-1 text-lg font-semibold">New admission</h1>
      </div>
      <AdminOnly check={canManageAdmissions} description="Only administrators and registrars can create admissions.">
        <AdmissionForm
          mutateAsync={(data) => createAdmission.mutateAsync(data)}
          isPending={createAdmission.isPending}
          submitLabel="Create admission"
          onSuccess={(admission) => router.push(`/admissions/${admission.id}`)}
          onCancel={() => router.push("/admissions")}
        />
      </AdminOnly>
    </main>
  );
}

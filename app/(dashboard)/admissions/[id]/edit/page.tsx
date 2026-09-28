"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { AdmissionForm } from "@/components/admissions/admission-form";
import { ErrorState, LoadingState } from "@/components/data-state";
import { canManageAdmissions } from "@/lib/auth/permissions";
import { useAdmission, useUpdateAdmission } from "@/lib/admissions/queries";

function EditAdmissionContent({ admissionId }: { admissionId: number }) {
  const router = useRouter();
  const admissionQuery = useAdmission(admissionId);
  const updateAdmission = useUpdateAdmission(admissionId);

  if (admissionQuery.isPending) return <LoadingState label="Loading admission…" />;
  if (admissionQuery.isError) {
    return <ErrorState error={admissionQuery.error} onRetry={() => admissionQuery.refetch()} />;
  }

  const admission = admissionQuery.data;

  return (
    <AdmissionForm
      defaultValues={{
        applicant_name: admission.applicant_name,
        date_of_birth: admission.date_of_birth,
        gender: admission.gender,
        intended_class_id: admission.intended_class?.id ?? null,
        previous_school: admission.previous_school,
        guardian_name: admission.guardian_name ?? "",
        guardian_phone: admission.guardian_phone,
        guardian_email: admission.guardian_email,
      }}
      mutateAsync={(data) => updateAdmission.mutateAsync(data)}
      isPending={updateAdmission.isPending}
      submitLabel="Save changes"
      onSuccess={() => router.push(`/admissions/${admissionId}`)}
      onCancel={() => router.push(`/admissions/${admissionId}`)}
    />
  );
}

export default function EditAdmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const admissionId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href={`/admissions/${admissionId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to admission
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Edit admission</h1>
      </div>
      <AdminOnly check={canManageAdmissions} description="Only administrators and registrars can edit admissions.">
        <EditAdmissionContent admissionId={admissionId} />
      </AdminOnly>
    </main>
  );
}

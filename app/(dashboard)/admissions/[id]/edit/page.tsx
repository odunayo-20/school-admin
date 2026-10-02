"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { AdmissionForm } from "@/components/admissions/admission-form";
import { ErrorState, LoadingState } from "@/components/data-state";
import { buttonVariants } from "@/components/ui/button";
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
  const isDecided = admission.status !== "PENDING" && (admission.status as string) !== "pending";

  if (isDecided) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-amber-800 dark:text-amber-300 space-y-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
          <div>
            <h2 className="text-base font-semibold">Admission Already Decided</h2>
            <p className="text-sm opacity-90 mt-1">
              This application has been decided as <span className="font-bold uppercase">{admission.status}</span>. Under school policy and system audit rules, decided records are permanently frozen and can no longer be edited.
            </p>
          </div>
        </div>
        <div>
          <Link
            href={`/admissions/${admissionId}`}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            ← Return to Admission Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <AdmissionForm
      defaultValues={{
        first_name: admission.first_name,
        middle_name: admission.middle_name ?? "",
        last_name: admission.last_name ?? "",
        date_of_birth: admission.date_of_birth,
        gender: admission.gender,
        academic_session_id: admission.academic_session?.id,
        entry_class_level_id: admission.entry_class_level?.id,
        admission_number: admission.admission_number,
        notes: admission.notes,
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
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <div>
        <Link
          href={`/admissions/${admissionId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admission
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">Edit Admission Application</h1>
        <p className="text-sm text-muted-foreground">
          Modify applicant demographic information or intake preferences before decision.
        </p>
      </div>
      <AdminOnly check={canManageAdmissions} description="Only administrators and registrars can edit admissions.">
        <EditAdmissionContent admissionId={admissionId} />
      </AdminOnly>
    </main>
  );
}

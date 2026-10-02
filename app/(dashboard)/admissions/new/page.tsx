"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { AdmissionForm } from "@/components/admissions/admission-form";
import { canManageAdmissions } from "@/lib/auth/permissions";
import { useCreateAdmission } from "@/lib/admissions/queries";

export default function NewAdmissionPage() {
  const router = useRouter();
  const createAdmission = useCreateAdmission();

  return (
    <main className="flex-1 space-y-6 px-6 py-8 md:px-8">
      <div>
        <Link
          href="/admissions"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to admissions queue
        </Link>
        <h1 className="mt-2 text-xl font-bold tracking-tight text-foreground">Record New Admission Application</h1>
        <p className="text-sm text-muted-foreground">
          Capture applicant intake information for review. An admission record is created in pending status; accepting the application later creates the official student enrollment record.
        </p>
      </div>

      <AdminOnly check={canManageAdmissions} description="Only administrators and registrars can record admissions.">
        <AdmissionForm
          mutateAsync={(data) => createAdmission.mutateAsync(data)}
          isPending={createAdmission.isPending}
          submitLabel="Submit Application"
          onSuccess={(admission) => router.push(`/admissions/${admission.id}`)}
          onCancel={() => router.push("/admissions")}
        />
      </AdminOnly>
    </main>
  );
}

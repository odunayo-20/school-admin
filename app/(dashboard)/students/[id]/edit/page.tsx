"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminOnly } from "@/components/auth/admin-only";
import { ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { canManageStudents } from "@/lib/auth/permissions";
import { useStudent, useUpdateStudentPersonalInfo } from "@/lib/students/queries";
import { ApiError } from "@/lib/api/errors";

const personalSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "male", "female", ""]),
});
type PersonalFormValues = z.infer<typeof personalSchema>;

function EditStudentContent({ studentId }: { studentId: number }) {
  const router = useRouter();
  const studentQuery = useStudent(studentId);
  const updatePersonalInfo = useUpdateStudentPersonalInfo(studentId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalFormValues>({
    resolver: zodResolver(personalSchema),
    values: studentQuery.data
      ? {
          name:
            studentQuery.data.full_name ||
            studentQuery.data.name ||
            [studentQuery.data.first_name, studentQuery.data.middle_name, studentQuery.data.last_name]
              .filter(Boolean)
              .join(" ") ||
            "",
          date_of_birth: studentQuery.data.date_of_birth ?? "",
          gender: (studentQuery.data.gender?.toUpperCase() as any) ?? "",
        }
      : undefined,
  });

  if (studentQuery.isPending) return <LoadingState label="Loading student…" />;
  if (studentQuery.isError) return <ErrorState error={studentQuery.error} onRetry={() => studentQuery.refetch()} />;

  async function onSubmit(values: PersonalFormValues) {
    setFormError(null);
    try {
      await updatePersonalInfo.mutateAsync({
        name: values.name,
        date_of_birth: values.date_of_birth || null,
        gender: (values.gender ? values.gender.toUpperCase() : null) as any,
      });
      router.push(`/students/${studentId}`);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...register("name")} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of birth</Label>
        <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select id="gender" {...register("gender")}>
          <option value="">Not specified</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </Select>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={updatePersonalInfo.isPending}>
          {updatePersonalInfo.isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(`/students/${studentId}`)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const studentId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href={`/students/${studentId}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to profile
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Edit personal information</h1>
      </div>
      <AdminOnly check={canManageStudents} description="Only administrators and registrars can edit student records.">
        <EditStudentContent studentId={studentId} />
      </AdminOnly>
    </main>
  );
}

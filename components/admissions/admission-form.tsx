"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useClasses } from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { Admission, AdmissionInput } from "@/lib/admissions/types";

const admissionSchema = z.object({
  applicant_name: z.string().min(1, "Applicant name is required").max(255),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["male", "female", ""]),
  intended_class_id: z.string().optional().or(z.literal("")),
  previous_school: z.string().max(255).optional().or(z.literal("")),
  guardian_name: z.string().min(1, "Guardian name is required").max(255),
  guardian_phone: z.string().max(30).optional().or(z.literal("")),
  guardian_email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
});
type AdmissionFormValues = z.infer<typeof admissionSchema>;

function toAdmissionInput(values: AdmissionFormValues): AdmissionInput {
  return {
    applicant_name: values.applicant_name,
    date_of_birth: values.date_of_birth || null,
    gender: values.gender || null,
    intended_class_id: values.intended_class_id ? Number(values.intended_class_id) : null,
    previous_school: values.previous_school || null,
    guardian_name: values.guardian_name,
    guardian_phone: values.guardian_phone || null,
    guardian_email: values.guardian_email || null,
  };
}

export function AdmissionForm({
  defaultValues,
  mutateAsync,
  isPending,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  defaultValues?: Partial<AdmissionInput>;
  mutateAsync: (data: AdmissionInput) => Promise<Admission>;
  isPending: boolean;
  submitLabel: string;
  onSuccess: (admission: Admission) => void;
  onCancel: () => void;
}) {
  const classesQuery = useClasses(1);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      applicant_name: defaultValues?.applicant_name ?? "",
      date_of_birth: defaultValues?.date_of_birth ?? "",
      gender: defaultValues?.gender ?? "",
      intended_class_id: defaultValues?.intended_class_id ? String(defaultValues.intended_class_id) : "",
      previous_school: defaultValues?.previous_school ?? "",
      guardian_name: defaultValues?.guardian_name ?? "",
      guardian_phone: defaultValues?.guardian_phone ?? "",
      guardian_email: defaultValues?.guardian_email ?? "",
    },
  });

  async function onSubmit(values: AdmissionFormValues) {
    setFormError(null);
    try {
      const admission = await mutateAsync(toAdmissionInput(values));
      onSuccess(admission);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in admissionSchema.shape) {
            setError(field as keyof AdmissionFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-8">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Applicant information</h2>
        <div className="space-y-2">
          <Label htmlFor="applicant_name">Applicant name</Label>
          <Input id="applicant_name" {...register("applicant_name")} aria-invalid={Boolean(errors.applicant_name)} />
          {errors.applicant_name && <p className="text-sm text-destructive">{errors.applicant_name.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of birth</Label>
            <Input id="date_of_birth" type="date" {...register("date_of_birth")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select id="gender" {...register("gender")}>
              <option value="">Not specified</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Academic information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="intended_class_id">Intended class</Label>
            <Select id="intended_class_id" {...register("intended_class_id")}>
              <option value="">Not specified</option>
              {classesQuery.data?.data.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="previous_school">Previous school</Label>
            <Input id="previous_school" {...register("previous_school")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Guardian information</h2>
        <div className="space-y-2">
          <Label htmlFor="guardian_name">Guardian name</Label>
          <Input id="guardian_name" {...register("guardian_name")} aria-invalid={Boolean(errors.guardian_name)} />
          {errors.guardian_name && <p className="text-sm text-destructive">{errors.guardian_name.message}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardian_phone">Guardian phone</Label>
            <Input id="guardian_phone" {...register("guardian_phone")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian_email">Guardian email</Label>
            <Input
              id="guardian_email"
              type="email"
              {...register("guardian_email")}
              aria-invalid={Boolean(errors.guardian_email)}
            />
            {errors.guardian_email && <p className="text-sm text-destructive">{errors.guardian_email.message}</p>}
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

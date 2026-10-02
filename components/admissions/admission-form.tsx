"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar,
  FileText,
  GraduationCap,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useAcademicSessions, useClassLevels } from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { Admission, AdmissionInput } from "@/lib/admissions/types";

const admissionSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  middle_name: z.string().max(100).optional().or(z.literal("")),
  last_name: z.string().max(100).optional().or(z.literal("")),
  date_of_birth: z.string().optional().or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", ""]),
  academic_session_id: z.string().min(1, "Please select an academic session"),
  entry_class_level_id: z.string().optional().or(z.literal("")),
  admission_number: z.string().max(50).optional().or(z.literal("")),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional().or(z.literal("")),
});

type AdmissionFormValues = z.infer<typeof admissionSchema>;

function toAdmissionInput(values: AdmissionFormValues): AdmissionInput {
  const firstName = values.first_name.trim();
  const lastName = values.last_name?.trim() || null;
  const fullName = [firstName, values.middle_name?.trim(), lastName].filter(Boolean).join(" ");

  return {
    first_name: firstName,
    middle_name: values.middle_name?.trim() || null,
    last_name: lastName,
    date_of_birth: values.date_of_birth || null,
    gender: (values.gender ? values.gender : null) as any,
    academic_session_id: Number(values.academic_session_id),
    entry_class_level_id: values.entry_class_level_id ? Number(values.entry_class_level_id) : null,
    admission_number: values.admission_number?.trim() || null,
    notes: values.notes?.trim() || null,

    // Backward compatibility aliases
    applicant_name: fullName,
    intended_class_id: values.entry_class_level_id ? Number(values.entry_class_level_id) : null,
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
  defaultValues?: Partial<AdmissionInput> & {
    applicant_name?: string;
    intended_class_id?: number | null;
  };
  mutateAsync: (data: AdmissionInput) => Promise<Admission>;
  isPending: boolean;
  submitLabel: string;
  onSuccess: (admission: Admission) => void;
  onCancel: () => void;
}) {
  const sessionsQuery = useAcademicSessions(1);
  const classLevelsQuery = useClassLevels(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Derive initial first/last names from applicant_name if separate names aren't provided
  let initialFirst = defaultValues?.first_name ?? "";
  let initialLast = defaultValues?.last_name ?? "";
  if (!initialFirst && defaultValues?.applicant_name) {
    const parts = defaultValues.applicant_name.trim().split(" ");
    initialFirst = parts[0] || "";
    initialLast = parts.slice(1).join(" ") || "";
  }

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      first_name: initialFirst,
      middle_name: defaultValues?.middle_name ?? "",
      last_name: initialLast,
      date_of_birth: defaultValues?.date_of_birth ?? "",
      gender: (defaultValues?.gender ? defaultValues.gender.toUpperCase() : "") as any,
      academic_session_id: defaultValues?.academic_session_id ? String(defaultValues.academic_session_id) : "",
      entry_class_level_id: defaultValues?.entry_class_level_id
        ? String(defaultValues.entry_class_level_id)
        : defaultValues?.intended_class_id
        ? String(defaultValues.intended_class_id)
        : "",
      admission_number: defaultValues?.admission_number ?? "",
      notes: defaultValues?.notes ?? "",
    },
  });

  const selectedSessionId = watch("academic_session_id");

  // Auto-select active session if none is selected
  useEffect(() => {
    if (!selectedSessionId && sessionsQuery.data?.data) {
      const activeSession =
        sessionsQuery.data.data.find((s) => s.status === "ACTIVE" || (s.status as string) === "active") ||
        sessionsQuery.data.data[0];
      if (activeSession) {
        setValue("academic_session_id", String(activeSession.id));
      }
    }
  }, [selectedSessionId, sessionsQuery.data, setValue]);

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
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please check your inputs and try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-6">
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      {/* Target Intake Section */}
      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Target Intake & Session</h2>
            <p className="text-xs text-muted-foreground">Specify which intake year and level the candidate is applying for</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="academic_session_id" className="text-xs font-medium">
              Academic Session <span className="text-destructive">*</span>
            </Label>
            <Select
              id="academic_session_id"
              {...register("academic_session_id")}
              aria-invalid={Boolean(errors.academic_session_id)}
            >
              <option value="">Select session…</option>
              {sessionsQuery.data?.data
                .filter((s) => s.status !== "COMPLETED" && (s.status as string) !== "completed")
                .map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name} {session.status === "ACTIVE" || (session.status as string) === "active" ? "(Active Intake)" : ""}
                  </option>
                ))}
            </Select>
            {errors.academic_session_id && (
              <p className="text-xs text-destructive">{errors.academic_session_id.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="entry_class_level_id" className="text-xs font-medium">
              Entry Class Level (Optional)
            </Label>
            <Select id="entry_class_level_id" {...register("entry_class_level_id")}>
              <option value="">Not yet decided / General</option>
              {classLevelsQuery.data?.data
                .filter((lvl) => lvl.status !== "ARCHIVED" && (lvl.status as string) !== "archived")
                .map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.name} ({lvl.code})
                  </option>
                ))}
            </Select>
            <p className="text-[11px] text-muted-foreground">
              What level the applicant is seeking admission into.
            </p>
          </div>
        </div>
      </section>

      {/* Applicant Personal Information */}
      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <User className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Applicant Details</h2>
            <p className="text-xs text-muted-foreground">Personal identification details for this candidate</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name" className="text-xs font-medium">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              placeholder="e.g. Ada"
              {...register("first_name")}
              aria-invalid={Boolean(errors.first_name)}
            />
            {errors.first_name && (
              <p className="text-xs text-destructive">{errors.first_name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="middle_name" className="text-xs font-medium">
              Middle Name
            </Label>
            <Input
              id="middle_name"
              placeholder="e.g. Ngozi"
              {...register("middle_name")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last_name" className="text-xs font-medium">
              Last / Family Name
            </Label>
            <Input
              id="last_name"
              placeholder="e.g. Okonkwo"
              {...register("last_name")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="date_of_birth" className="text-xs font-medium">
              Date of Birth
            </Label>
            <div className="relative">
              <Input
                id="date_of_birth"
                type="date"
                {...register("date_of_birth")}
              />
            </div>
            {errors.date_of_birth && (
              <p className="text-xs text-destructive">{errors.date_of_birth.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="gender" className="text-xs font-medium">
              Gender
            </Label>
            <Select id="gender" {...register("gender")}>
              <option value="">Not specified</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Reference & Remarks Section */}
      <section className="rounded-xl border border-border/70 bg-card p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Reference & Remarks</h2>
            <p className="text-xs text-muted-foreground">Optional admission code and evaluation notes</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admission_number" className="text-xs font-medium">
              Custom Admission Number (Optional)
            </Label>
            <Input
              id="admission_number"
              placeholder="Leave blank to auto-generate (e.g. ADM-0001)"
              className="font-mono text-sm"
              {...register("admission_number")}
            />
            <p className="text-[11px] text-muted-foreground">
              If left blank, the system automatically assigns the next sequential admission code.
            </p>
            {errors.admission_number && (
              <p className="text-xs text-destructive">{errors.admission_number.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs font-medium">
              Application Notes & Background Remarks
            </Label>
            <textarea
              id="notes"
              rows={3}
              placeholder="e.g. Previous school, entrance screening scores, guardian contact or special remarks…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="gap-2">
          {isPending ? (
            "Saving…"
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

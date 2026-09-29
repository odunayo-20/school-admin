"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import type { Staff, StaffInput } from "@/lib/staff/types";

const staffSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  designation: z.string().max(100).optional().or(z.literal("")),
  employment_type: z.enum(["full_time", "part_time", "contract"]),
  date_joined: z.string().optional().or(z.literal("")),
  is_teacher: z.boolean(),
});
type StaffFormValues = z.infer<typeof staffSchema>;

function toStaffInput(values: StaffFormValues): StaffInput {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    designation: values.designation || null,
    employment_type: values.employment_type,
    date_joined: values.date_joined || null,
    is_teacher: values.is_teacher,
  };
}

export function StaffForm({
  defaultValues,
  mutateAsync,
  isPending,
  submitLabel,
  onSuccess,
  onCancel,
}: {
  defaultValues?: Partial<StaffInput>;
  mutateAsync: (data: StaffInput) => Promise<Staff>;
  isPending: boolean;
  submitLabel: string;
  onSuccess: (staff: Staff) => void;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      email: defaultValues?.email ?? "",
      phone: defaultValues?.phone ?? "",
      designation: defaultValues?.designation ?? "",
      employment_type: defaultValues?.employment_type ?? "full_time",
      date_joined: defaultValues?.date_joined ?? "",
      is_teacher: defaultValues?.is_teacher ?? false,
    },
  });

  async function onSubmit(values: StaffFormValues) {
    setFormError(null);
    try {
      const staff = await mutateAsync(toStaffInput(values));
      onSuccess(staff);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in staffSchema.shape) {
            setError(field as keyof StaffFormValues, { message: messages[0] });
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
        <h2 className="text-sm font-medium text-muted-foreground">Personal information</h2>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" {...register("name")} aria-invalid={Boolean(errors.name)} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Contact information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" {...register("phone")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground">Employment information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="designation">Designation</Label>
            <Input id="designation" placeholder="e.g. Mathematics Teacher" {...register("designation")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employment_type">Employment type</Label>
            <Select id="employment_type" {...register("employment_type")}>
              <option value="full_time">Full-time</option>
              <option value="part_time">Part-time</option>
              <option value="contract">Contract</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date_joined">Date joined</Label>
            <Input id="date_joined" type="date" {...register("date_joined")} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input
              id="is_teacher"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              {...register("is_teacher")}
            />
            <Label htmlFor="is_teacher" className="font-normal">
              This staff member teaches
            </Label>
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

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminOnly } from "@/components/auth/admin-only";
import { LoadingState, ErrorState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSchool, useUpdateSchool } from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { School } from "@/lib/academics/types";

const schoolSchema = z.object({
  name: z.string().min(1, "School name is required").max(255),
  code: z.string().min(1, "School code is required").max(50),
  address: z.string().max(500).optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
});

type SchoolFormValues = z.infer<typeof schoolSchema>;

function SchoolForm({ school }: { school: School }) {
  const updateSchool = useUpdateSchool();
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SchoolFormValues>({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: school.name,
      code: school.code,
      address: school.address ?? "",
      phone: school.phone ?? "",
      email: school.email ?? "",
    },
  });

  async function onSubmit(values: SchoolFormValues) {
    setFormError(null);
    setSaved(false);
    try {
      await updateSchool.mutateAsync({
        name: values.name,
        code: values.code,
        address: values.address || null,
        phone: values.phone || null,
        email: values.email || null,
      });
      setSaved(true);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in schoolSchema.shape) {
            setError(field as keyof SchoolFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-5">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}
      {saved && (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
          School profile saved.
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">School name</Label>
        <Input id="name" {...register("name")} aria-invalid={Boolean(errors.name)} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="code">School code</Label>
        <Input id="code" {...register("code")} aria-invalid={Boolean(errors.code)} />
        {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input id="address" {...register("address")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register("phone")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...register("email")} aria-invalid={Boolean(errors.email)} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <Button type="submit" disabled={updateSchool.isPending}>
        {updateSchool.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

function SchoolProfileContent() {
  const schoolQuery = useSchool();

  if (schoolQuery.isPending) return <LoadingState label="Loading school profile…" />;
  if (schoolQuery.isError) {
    return <ErrorState error={schoolQuery.error} onRetry={() => schoolQuery.refetch()} />;
  }

  return <SchoolForm school={schoolQuery.data} />;
}

export default function SchoolProfilePage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">School Profile</h1>
        <p className="text-sm text-muted-foreground">Basic information about your school.</p>
      </div>
      <AdminOnly>
        <SchoolProfileContent />
      </AdminOnly>
    </main>
  );
}

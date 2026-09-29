"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import type { Guardian, GuardianInput } from "@/lib/students/types";

const guardianSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  relationship: z.enum(["father", "mother", "guardian"]),
  phone: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email address").optional().or(z.literal("")),
  address: z.string().max(500).optional().or(z.literal("")),
});
type GuardianFormValues = z.infer<typeof guardianSchema>;

export function GuardianFormDialog({
  open,
  onOpenChange,
  guardian,
  mutateAsync,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guardian?: Guardian;
  mutateAsync: (data: GuardianInput) => Promise<Guardian>;
  isPending: boolean;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianSchema),
    defaultValues: {
      name: guardian?.name ?? "",
      relationship: guardian?.relationship ?? "guardian",
      phone: guardian?.phone ?? "",
      email: guardian?.email ?? "",
      address: guardian?.address ?? "",
    },
  });

  async function onSubmit(values: GuardianFormValues) {
    setFormError(null);
    const data: GuardianInput = {
      name: values.name,
      relationship: values.relationship,
      phone: values.phone || null,
      email: values.email || null,
      address: values.address || null,
    };
    try {
      await mutateAsync(data);
      reset();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in guardianSchema.shape) {
            setError(field as keyof GuardianFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{guardian ? "Edit guardian" : "Add guardian"}</DialogTitle>
          <DialogDescription>Contact and relationship information.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="guardian-name">Name</Label>
            <Input id="guardian-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian-relationship">Relationship</Label>
            <Select id="guardian-relationship" {...register("relationship")}>
              <option value="father">Father</option>
              <option value="mother">Mother</option>
              <option value="guardian">Guardian</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guardian-phone">Phone</Label>
              <Input id="guardian-phone" {...register("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guardian-email">Email</Label>
              <Input id="guardian-email" type="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian-address">Address</Label>
            <Input id="guardian-address" {...register("address")} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

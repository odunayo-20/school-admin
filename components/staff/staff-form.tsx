"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Briefcase,
  Calendar,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/errors";
import type { Staff, StaffCreateInput, StaffUpdateInput } from "@/lib/staff/types";

// ── Schemas ───────────────────────────────────────────────────────────────────

const createSchema = z
  .object({
    name: z.string().min(1, "Full name is required").max(255),
    email: z.string().email("Enter a valid email address").max(255),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm the password"),
    staff_type: z.enum(["TEACHING", "NON_TEACHING"]).refine((v) => !!v, { message: "Staff type is required" }),
    staff_number: z.string().max(50).optional().or(z.literal("")),
    employment_date: z.string().optional().or(z.literal("")),
    phone: z.string().max(30).optional().or(z.literal("")),
    designation: z.string().max(100).optional().or(z.literal("")),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

const updateSchema = z.object({
  name: z.string().min(1, "Full name is required").max(255),
  email: z.string().email("Enter a valid email address").max(255),
  staff_type: z.enum(["TEACHING", "NON_TEACHING"]).refine((v) => !!v, { message: "Staff type is required" }),
  staff_number: z.string().max(50).optional().or(z.literal("")),
  employment_date: z.string().optional().or(z.literal("")),
  phone: z.string().max(30).optional().or(z.literal("")),
  designation: z.string().max(100).optional().or(z.literal("")),
});

type CreateFormValues = z.infer<typeof createSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

// ── Section wrapper ───────────────────────────────────────────────────────────

function FormSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-1 border-b border-border/60">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-muted">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function FieldError({ message }: { message: string | undefined }) {
  if (!message) return null;
  return <p className="text-xs text-destructive mt-1">{message}</p>;
}

// ── Create form ───────────────────────────────────────────────────────────────

export function StaffCreateForm({
  onSuccess,
  onCancel,
  mutateAsync,
  isPending,
}: {
  mutateAsync: (data: StaffCreateInput) => Promise<Staff>;
  isPending: boolean;
  onSuccess: (staff: Staff) => void;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      staff_type: "NON_TEACHING",
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      staff_number: "",
      employment_date: "",
      phone: "",
      designation: "",
    },
  });

  const selectedType = watch("staff_type");

  async function onSubmit(values: CreateFormValues) {
    setFormError(null);
    try {
      const staff = await mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
        password_confirmation: values.password_confirmation,
        staff_type: values.staff_type,
        staff_number: values.staff_number || null,
        employment_date: values.employment_date || null,
        phone: values.phone || null,
        designation: values.designation || null,
      });
      onSuccess(staff);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in createSchema.shape) {
            setError(field as keyof CreateFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      {/* Identity */}
      <FormSection title="Personal information" icon={User}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Amara Okonkwo"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name?.message} />
        </div>
      </FormSection>

      {/* Account credentials */}
      <FormSection title="Login account" icon={KeyRound}>
        <p className="text-xs text-muted-foreground -mt-2">
          A login account is required for all staff. You set the initial credentials — the staff
          member can change their password after first login.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="staff@school.edu"
              className="pl-9"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          <FieldError message={errors.email?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 characters"
                className="pr-9"
                {...register("password")}
                aria-invalid={Boolean(errors.password)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={errors.password?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password_confirmation">Confirm password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showConfirm ? "text" : "password"}
                placeholder="Repeat password"
                className="pr-9"
                {...register("password_confirmation")}
                aria-invalid={Boolean(errors.password_confirmation)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <FieldError message={errors.password_confirmation?.message} />
          </div>
        </div>
      </FormSection>

      {/* Employment */}
      <FormSection title="Employment" icon={Briefcase}>
        <div className="space-y-1.5">
          <Label htmlFor="staff_type">Staff type <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-2 gap-3">
            {(["NON_TEACHING", "TEACHING"] as const).map((type) => {
              const isSelected = selectedType === type;
              const Icon = type === "TEACHING" ? GraduationCap : Briefcase;
              return (
                <label
                  key={type}
                  htmlFor={`staff_type_${type}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? type === "TEACHING"
                        ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                        : "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    id={`staff_type_${type}`}
                    value={type}
                    {...register("staff_type")}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">
                    {type === "TEACHING" ? "Teaching" : "Non-teaching"}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError message={errors.staff_type?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              placeholder="e.g. Mathematics Teacher"
              {...register("designation")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff_number">Staff number</Label>
            <Input
              id="staff_number"
              placeholder="Auto-generated if blank"
              {...register("staff_number")}
            />
            <p className="text-xs text-muted-foreground">Leave blank to auto-assign.</p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="phone"
                placeholder="+234 800 000 0000"
                className="pl-9"
                {...register("phone")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employment_date">Employment date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="employment_date"
                type="date"
                className="pl-9"
                {...register("employment_date")}
              />
            </div>
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create staff member"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Update form ───────────────────────────────────────────────────────────────

export function StaffUpdateForm({
  defaultValues,
  onSuccess,
  onCancel,
  mutateAsync,
  isPending,
}: {
  defaultValues: Partial<Staff>;
  mutateAsync: (data: StaffUpdateInput) => Promise<Staff>;
  isPending: boolean;
  onSuccess: (staff: Staff) => void;
  onCancel: () => void;
}) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: defaultValues.name ?? "",
      email: defaultValues.email ?? "",
      staff_type: (defaultValues.staff_type as "TEACHING" | "NON_TEACHING") ?? "NON_TEACHING",
      staff_number: defaultValues.staff_number ?? defaultValues.staff_no ?? "",
      employment_date: defaultValues.employment_date ?? defaultValues.date_joined ?? "",
      phone: defaultValues.phone ?? "",
      designation: defaultValues.designation ?? "",
    },
  });

  const selectedType = watch("staff_type");

  async function onSubmit(values: UpdateFormValues) {
    setFormError(null);
    try {
      const staff = await mutateAsync({
        name: values.name,
        email: values.email,
        staff_type: values.staff_type,
        staff_number: values.staff_number || null,
        employment_date: values.employment_date || null,
        phone: values.phone || null,
        designation: values.designation || null,
      });
      onSuccess(staff);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in updateSchema.shape) {
            setError(field as keyof UpdateFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(
        error instanceof ApiError ? error.message : "Something went wrong. Please try again."
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-5">
      {formError && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {formError}
        </div>
      )}

      {/* Identity */}
      <FormSection title="Personal information" icon={User}>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Amara Okonkwo"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          <FieldError message={errors.name?.message} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              className="pl-9"
              {...register("email")}
              aria-invalid={Boolean(errors.email)}
            />
          </div>
          <FieldError message={errors.email?.message} />
          <p className="text-xs text-muted-foreground">
            Changing the email here does not update the login account email.
          </p>
        </div>
      </FormSection>

      {/* Employment */}
      <FormSection title="Employment" icon={Briefcase}>
        <div className="space-y-1.5">
          <Label>Staff type <span className="text-destructive">*</span></Label>
          <div className="grid grid-cols-2 gap-3">
            {(["NON_TEACHING", "TEACHING"] as const).map((type) => {
              const isSelected = selectedType === type;
              const Icon = type === "TEACHING" ? GraduationCap : Briefcase;
              return (
                <label
                  key={type}
                  htmlFor={`edit_staff_type_${type}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-all ${
                    isSelected
                      ? type === "TEACHING"
                        ? "border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                        : "border-sky-500 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                      : "border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground"
                  }`}
                >
                  <input
                    type="radio"
                    id={`edit_staff_type_${type}`}
                    value={type}
                    {...register("staff_type")}
                    className="sr-only"
                  />
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-sm font-medium">
                    {type === "TEACHING" ? "Teaching" : "Non-teaching"}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError message={errors.staff_type?.message} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="designation">Designation</Label>
            <Input
              id="designation"
              placeholder="e.g. Mathematics Teacher"
              {...register("designation")}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="staff_number">Staff number</Label>
            <Input id="staff_number" {...register("staff_number")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input id="phone" placeholder="+234 800 000 0000" className="pl-9" {...register("phone")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employment_date">Employment date</Label>
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input id="employment_date" type="date" className="pl-9" {...register("employment_date")} />
            </div>
          </div>
        </div>
      </FormSection>

      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ── Legacy shim (keeps old import alive for any code that imports StaffForm) ──
export { StaffCreateForm as StaffForm };

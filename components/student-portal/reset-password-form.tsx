"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResetPassword } from "@/lib/student-portal/queries";
import { ApiError } from "@/lib/api/errors";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Please confirm your new password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords do not match",
    path: ["password_confirmation"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

/**
 * The link this form is reached from is emailed by the real backend's
 * forgot-password flow (see StudentSettingsPage) and carries `token` and
 * `email` as query params — see AppServiceProvider::configurePasswordResetUrl()
 * on the backend, which points there because the endpoint that actually
 * consumes a reset token is POST-only and so can never be a directly
 * clickable link itself.
 */
export function StudentResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  if (!token || !email) {
    return (
      <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
        This link is missing its token or email. Please use the link from your email exactly as sent, or request a new one from the Settings page.
      </p>
    );
  }

  async function onSubmit(values: ResetPasswordValues) {
    setFormError(null);
    try {
      await resetPassword.mutateAsync({ token, email, ...values });
      setDone(true);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field === "password" || field === "password_confirmation") {
            setError(field as keyof ResetPasswordValues, { message: messages[0] });
          } else if (field === "email") {
            setFormError(messages[0]);
          }
        }
        return;
      }

      if (error instanceof ApiError) {
        setFormError(error.message);
        return;
      }

      setFormError("Something went wrong. Please try again.");
    }
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-muted-foreground">
          Your password has been reset. You can now sign in with your new password.
        </p>
        <Link href="/student/login" className={buttonVariants({ className: "w-full" })}>
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <div className="relative">
          <Input
            id="reset-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "reset-password-error" : undefined}
            className="pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
        {errors.password && (
          <p id="reset-password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-password-confirmation">Confirm new password</Label>
        <Input
          id="reset-password-confirmation"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password_confirmation)}
          aria-describedby={errors.password_confirmation ? "reset-password-confirmation-error" : undefined}
          {...register("password_confirmation")}
        />
        {errors.password_confirmation && (
          <p id="reset-password-confirmation-error" className="text-sm text-destructive">
            {errors.password_confirmation.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
        {resetPassword.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {resetPassword.isPending ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}

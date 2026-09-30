"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVerifyResult } from "@/lib/result-checker/queries";
import { ApiError } from "@/lib/api/errors";
import type { VerifiedResult } from "@/lib/result-checker/types";

const checkSchema = z.object({
  student_number: z.string().trim().min(1, "Enter your Student ID"),
  date_of_birth: z.string().min(1, "Enter your date of birth"),
  term_id: z
    .string()
    .trim()
    .min(1, "Enter the term ID")
    .regex(/^\d+$/, "Term ID must be a number"),
});

type CheckFormValues = z.infer<typeof checkSchema>;

/**
 * Only ever surfaces `error.message` from the API verbatim — never invents
 * or infers copy about why verification failed. See
 * lib/result-checker/types.ts: every failure reason (wrong date of birth,
 * unknown student, unpublished result) collapses to the identical backend
 * message, confirmed live, so there is nothing for this form to add.
 */
export function VerifyForm({ onVerified }: { onVerified: (result: VerifiedResult) => void }) {
  const verify = useVerifyResult();
  const searchParams = useSearchParams();
  const termFromLink = searchParams.get("term") ?? "";
  const [formError, setFormError] = useState<string | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<CheckFormValues>({
    resolver: zodResolver(checkSchema),
    defaultValues: { student_number: "", date_of_birth: "", term_id: termFromLink },
  });

  // Purely a UX courtesy — visually discourages hammering the submit button
  // right after a 429. Laravel's own throttle middleware is what actually
  // enforces the limit; this countdown provides no security of its own. The
  // real backend doesn't send a Retry-After header on this route (confirmed
  // live), so retryAfterSeconds is usually null here and this never runs —
  // kept so the UI still degrades correctly if that ever changes.
  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) return;
    const timer = setTimeout(() => setRetryAfterSeconds((s) => (s !== null ? s - 1 : s)), 1000);
    return () => clearTimeout(timer);
  }, [retryAfterSeconds]);

  async function onSubmit(values: CheckFormValues) {
    setFormError(null);
    try {
      const result = await verify.mutateAsync({
        student_number: values.student_number,
        date_of_birth: values.date_of_birth,
        term_id: Number(values.term_id),
      });
      onVerified(result);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.kind === "validation" && error.fieldErrors) {
          for (const [field, messages] of Object.entries(error.fieldErrors)) {
            if (field === "student_number" || field === "date_of_birth" || field === "term_id") {
              setError(field, { message: messages[0] });
            }
          }
          return;
        }
        if (error.kind === "rate_limited") {
          setRetryAfterSeconds(error.retryAfterSeconds ?? null);
        }
        setFormError(error.message);
        return;
      }
      setFormError("Something went wrong. Please try again.");
    }
  }

  const rateLimited = retryAfterSeconds !== null && retryAfterSeconds > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {formError && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {formError}
            {rateLimited && ` You can try again in ${retryAfterSeconds}s.`}
          </span>
        </p>
      )}

      <div className="space-y-2">
        <Label htmlFor="student_number">Student ID</Label>
        <Input
          id="student_number"
          autoComplete="off"
          placeholder="e.g. STU-0001"
          aria-invalid={Boolean(errors.student_number)}
          aria-describedby={errors.student_number ? "student_number-error" : undefined}
          {...register("student_number")}
        />
        {errors.student_number && (
          <p id="student_number-error" className="text-sm text-destructive">
            {errors.student_number.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">Date of birth</Label>
        <Input
          id="date_of_birth"
          type="date"
          aria-invalid={Boolean(errors.date_of_birth)}
          aria-describedby={errors.date_of_birth ? "date_of_birth-error" : "date_of_birth-hint"}
          {...register("date_of_birth")}
        />
        {errors.date_of_birth ? (
          <p id="date_of_birth-error" className="text-sm text-destructive">
            {errors.date_of_birth.message}
          </p>
        ) : (
          <p id="date_of_birth-hint" className="text-sm text-muted-foreground">
            The student&apos;s date of birth, as given at registration.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="term_id">Term ID</Label>
        <Input
          id="term_id"
          inputMode="numeric"
          placeholder="e.g. 1"
          aria-invalid={Boolean(errors.term_id)}
          aria-describedby={errors.term_id ? "term_id-error" : "term_id-hint"}
          {...register("term_id")}
        />
        {errors.term_id ? (
          <p id="term_id-error" className="text-sm text-destructive">
            {errors.term_id.message}
          </p>
        ) : (
          <p id="term_id-hint" className="text-sm text-muted-foreground">
            From the link or notice your school shared for this term&apos;s results.
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={verify.isPending || rateLimited}>
        {verify.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {verify.isPending ? "Checking…" : "Check result"}
      </Button>
    </form>
  );
}

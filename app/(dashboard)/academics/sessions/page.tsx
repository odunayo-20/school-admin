"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Layers,
  Pencil,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PaginationControls } from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAcademicContext,
  useAcademicSessions,
  useActivateAcademicSession,
  useActivateTerm,
  useCreateAcademicSession,
  useCreateTerm,
  useDeleteAcademicSession,
  useDeleteTerm,
  useTerms,
  useUpdateAcademicSession,
  useUpdateTerm,
} from "@/lib/academics/queries";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { AcademicSession, Term } from "@/lib/academics/types";
import { cn } from "@/lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function normalizeSessionStatus(
  session: AcademicSession
): "ACTIVE" | "UPCOMING" | "COMPLETED" {
  if (session.is_current || session.status === "ACTIVE") return "ACTIVE";
  if (session.status === "COMPLETED") return "COMPLETED";
  return "UPCOMING";
}

function normalizeTermStatus(term: Term): "ACTIVE" | "UPCOMING" | "COMPLETED" {
  if (term.is_current || term.status === "ACTIVE") return "ACTIVE";
  if (term.status === "COMPLETED") return "COMPLETED";
  return "UPCOMING";
}

// ── Status Badges ─────────────────────────────────────────────────────────────

function SessionStatusBadge({ session }: { session: AcademicSession }) {
  const status = normalizeSessionStatus(session);

  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Current Active
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-muted-foreground/20 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
      <Clock className="h-3 w-3" />
      Upcoming
    </span>
  );
}

function TermStatusBadge({ term }: { term: Term }) {
  const status = normalizeTermStatus(term);

  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active Term
      </span>
    );
  }

  if (status === "COMPLETED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/30 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
        <CheckCircle2 className="h-3 w-3" />
        Completed
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
      <Clock className="h-3 w-3" />
      Upcoming
    </span>
  );
}

// ── Session Form Dialog ───────────────────────────────────────────────────────

const sessionSchema = z
  .object({
    name: z
      .string()
      .min(1, "Session name is required")
      .max(50, "Maximum 50 characters"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  });

type SessionFormValues = z.infer<typeof sessionSchema>;

function SessionFormDialog({
  open,
  onOpenChange,
  session,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session?: AcademicSession;
}) {
  const createSession = useCreateAcademicSession();
  const updateSession = useUpdateAcademicSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      start_date: "",
      end_date: "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: session?.name ?? "",
        start_date: session?.start_date ?? "",
        end_date: session?.end_date ?? "",
      });
      setFormError(null);
    }
  }, [open, session, reset]);

  const isPending = createSession.isPending || updateSession.isPending;

  async function onSubmit(values: SessionFormValues) {
    setFormError(null);
    try {
      if (session) {
        await updateSession.mutateAsync({
          id: session.id,
          data: {
            name: values.name.trim(),
            start_date: values.start_date,
            end_date: values.end_date,
          },
        });
      } else {
        await createSession.mutateAsync({
          name: values.name.trim(),
          start_date: values.start_date,
          end_date: values.end_date,
        });
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in sessionSchema.shape) {
            setError(field as keyof SessionFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {session ? "Edit Academic Session" : "Create Academic Session"}
          </DialogTitle>
          <DialogDescription>
            {session
              ? `Update details for session ${session.name}.`
              : "Define a school year. The system automatically normalizes separators (e.g. 2026-2027 becomes 2026/2027)."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{formError}</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="session-name">Session Name</Label>
            <Input
              id="session-name"
              placeholder="2026/2027"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            <p className="text-[11px] text-muted-foreground">
              Format: YYYY/YYYY (e.g., 2026/2027)
            </p>
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="session-start">Start Date</Label>
              <Input
                id="session-start"
                type="date"
                {...register("start_date")}
                aria-invalid={Boolean(errors.start_date)}
              />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="session-end">End Date</Label>
              <Input
                id="session-end"
                type="date"
                {...register("end_date")}
                aria-invalid={Boolean(errors.end_date)}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : session ? "Save Changes" : "Create Session"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Term Form Dialog ──────────────────────────────────────────────────────────

const termSchema = z
  .object({
    name: z.string().min(1, "Term name is required").max(100),
    term_number: z.coerce
      .number()
      .int("Must be a whole number")
      .min(1, "Term number must be between 1 and 20")
      .max(20, "Term number cannot exceed 20"),
    start_date: z.string().min(1, "Start date is required"),
    end_date: z.string().min(1, "End date is required"),
  })
  .refine((data) => data.end_date > data.start_date, {
    message: "Term end date must be after start date",
    path: ["end_date"],
  });

type TermFormInput = z.input<typeof termSchema>;
type TermFormValues = z.output<typeof termSchema>;

const TERM_PRESETS = [
  { name: "First Term", number: 1 },
  { name: "Second Term", number: 2 },
  { name: "Third Term", number: 3 },
];

function TermFormDialog({
  open,
  onOpenChange,
  session,
  term,
  existingTerms = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: AcademicSession;
  term?: Term;
  existingTerms?: Term[];
}) {
  const createTerm = useCreateTerm(session.id);
  const updateTerm = useUpdateTerm(session.id);
  const [formError, setFormError] = useState<string | null>(null);

  // Pick sensible next term number if creating
  const nextAvailableNumber = useMemo(() => {
    if (term) return term.term_number;
    const used = new Set(existingTerms.map((t) => t.term_number));
    for (let i = 1; i <= 20; i++) {
      if (!used.has(i)) return i;
    }
    return 1;
  }, [existingTerms, term]);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<TermFormInput, unknown, TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: "",
      term_number: 1,
      start_date: "",
      end_date: "",
    },
  });

  const startDateValue = watch("start_date");
  const endDateValue = watch("end_date");

  useEffect(() => {
    if (open) {
      if (term) {
        reset({
          name: term.name,
          term_number: term.term_number,
          start_date: term.start_date,
          end_date: term.end_date,
        });
      } else {
        const defaultName =
          nextAvailableNumber === 1
            ? "First Term"
            : nextAvailableNumber === 2
            ? "Second Term"
            : nextAvailableNumber === 3
            ? "Third Term"
            : `Term ${nextAvailableNumber}`;
        reset({
          name: defaultName,
          term_number: nextAvailableNumber,
          start_date: session.start_date,
          end_date: session.end_date,
        });
      }
      setFormError(null);
    }
  }, [open, term, session, reset, nextAvailableNumber]);

  const isPending = createTerm.isPending || updateTerm.isPending;

  // Real-time checks against parent session date boundaries
  const dateWarnings: string[] = [];
  if (startDateValue && session.start_date && startDateValue < session.start_date) {
    dateWarnings.push(`Start date is before session opening (${session.start_date}).`);
  }
  if (endDateValue && session.end_date && endDateValue > session.end_date) {
    dateWarnings.push(`End date is after session closing (${session.end_date}).`);
  }

  async function onSubmit(values: TermFormValues) {
    setFormError(null);
    try {
      if (term) {
        await updateTerm.mutateAsync({
          id: term.id,
          data: {
            name: values.name.trim(),
            term_number: values.term_number,
            start_date: values.start_date,
            end_date: values.end_date,
          },
        });
      } else {
        await createTerm.mutateAsync({
          name: values.name.trim(),
          term_number: values.term_number,
          start_date: values.start_date,
          end_date: values.end_date,
        });
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in termSchema.shape) {
            setError(field as keyof TermFormValues, { message: messages[0] });
          }
        }
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {term ? "Edit Academic Term" : `Add Term to ${session.name}`}
          </DialogTitle>
          <DialogDescription>
            Terms define marking periods. Dates must fall inside the session dates (
            <span className="font-medium text-foreground">
              {session.start_date}
            </span>{" "}
            to{" "}
            <span className="font-medium text-foreground">
              {session.end_date}
            </span>
            ).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {formError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{formError}</p>
            </div>
          )}

          {/* Quick preset chips */}
          {!term && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Quick Presets</Label>
              <div className="flex flex-wrap gap-2">
                {TERM_PRESETS.map((preset) => (
                  <button
                    key={preset.number}
                    type="button"
                    onClick={() => {
                      setValue("name", preset.name);
                      setValue("term_number", preset.number);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium hover:border-primary/50 hover:bg-muted/50 transition-colors"
                  >
                    <span>{preset.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      (T{preset.number})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="term-name">Term Name</Label>
              <Input
                id="term-name"
                placeholder="First Term"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="term-number">Order (1–20)</Label>
              <Input
                id="term-number"
                type="number"
                min={1}
                max={20}
                {...register("term_number")}
                aria-invalid={Boolean(errors.term_number)}
              />
              {errors.term_number && (
                <p className="text-xs text-destructive">{errors.term_number.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="term-start">Start Date</Label>
              <Input
                id="term-start"
                type="date"
                min={session.start_date}
                max={session.end_date}
                {...register("start_date")}
                aria-invalid={Boolean(errors.start_date)}
              />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="term-end">End Date</Label>
              <Input
                id="term-end"
                type="date"
                min={session.start_date}
                max={session.end_date}
                {...register("end_date")}
                aria-invalid={Boolean(errors.end_date)}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {dateWarnings.length > 0 && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              <p className="font-medium">Note:</p>
              <ul className="list-disc pl-4 space-y-0.5 mt-0.5">
                {dateWarnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : term ? "Save Changes" : "Add Term"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Confirmation Modal ────────────────────────────────────────────────────────

interface ConfirmState {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

function ConfirmActionDialog({
  state,
  onOpenChange,
}: {
  state: ConfirmState;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleConfirm() {
    setErrorMsg(null);
    setIsPending(true);
    try {
      await state.onConfirm();
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle
            className={cn(
              "flex items-center gap-2",
              state.isDestructive ? "text-destructive" : "text-foreground"
            )}
          >
            {state.isDestructive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            )}
            {state.title}
          </DialogTitle>
          <DialogDescription className="pt-1">
            {state.description}
          </DialogDescription>
        </DialogHeader>

        {errorMsg && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {errorMsg}
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={state.isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "Processing…" : state.actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Terms Nested Panel ────────────────────────────────────────────────────────

function TermsPanel({
  session,
  isParentActive,
  onOpenConfirm,
}: {
  session: AcademicSession;
  isParentActive: boolean;
  onOpenConfirm: (config: Omit<ConfirmState, "open">) => void;
}) {
  const termsQuery = useTerms(session.id);
  const activateTerm = useActivateTerm(session.id);
  const deleteTerm = useDeleteTerm(session.id);
  const [formDialogState, setFormDialogState] = useState<{
    open: boolean;
    term?: Term;
  }>({ open: false });

  if (termsQuery.isPending) return <LoadingState label="Loading terms…" />;
  if (termsQuery.isError) {
    return (
      <ErrorState
        error={termsQuery.error}
        onRetry={() => termsQuery.refetch()}
      />
    );
  }

  const terms = termsQuery.data ?? [];
  const isSessionCompleted = normalizeSessionStatus(session) === "COMPLETED";

  return (
    <div className="space-y-3.5 border-t border-border/70 bg-muted/15 p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">
              Terms for {session.name}
            </h4>
            <span className="text-xs text-muted-foreground">
              ({terms.length} {terms.length === 1 ? "term" : "terms"})
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dates must fall between {formatDate(session.start_date)} and{" "}
            {formatDate(session.end_date)}.
          </p>
        </div>

        {!isSessionCompleted && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 gap-1.5 self-start sm:self-auto text-xs"
            onClick={() => setFormDialogState({ open: true })}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            Add Term
          </Button>
        )}
      </div>

      {terms.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/80 bg-background/60 p-6 text-center">
          <Layers className="mx-auto h-7 w-7 text-muted-foreground/60 mb-2" />
          <p className="text-sm font-medium text-foreground">
            No terms configured yet
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-3">
            Add at least one term (e.g., First Term) to allow recording marks,
            attendance, and report cards for this school year.
          </p>
          {!isSessionCompleted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setFormDialogState({ open: true })}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add First Term
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm">
          <ul className="divide-y divide-border/60">
            {terms.map((term) => {
              const status = normalizeTermStatus(term);
              const isTermCompleted = status === "COMPLETED";
              const isTermActive = status === "ACTIVE";

              return (
                <li
                  key={term.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      T{term.term_number}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {term.name}
                        </span>
                        <TermStatusBadge term={term} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {formatDate(term.start_date)} – {formatDate(term.end_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {/* Activate Term */}
                    {!isTermActive && !isTermCompleted && isParentActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() =>
                          onOpenConfirm({
                            title: `Activate "${term.name}"?`,
                            description: `Activating ${term.name} will mark whichever term was currently active as COMPLETED. Exactly one term may be active across the school.`,
                            actionLabel: "Activate Term",
                            onConfirm: async () => {
                              await activateTerm.mutateAsync(term.id);
                            },
                          })
                        }
                      >
                        <Play className="h-3 w-3 mr-1 fill-current" />
                        Activate
                      </Button>
                    )}

                    {!isTermActive && !isTermCompleted && !isParentActive && (
                      <span
                        className="text-[11px] text-muted-foreground/80 italic pr-1"
                        title="You must activate this academic session before any of its terms can be made active."
                      >
                        Activate session first
                      </span>
                    )}

                    {/* Edit Term */}
                    {!isTermCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                        title="Edit term"
                        onClick={() =>
                          setFormDialogState({ open: true, term })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span className="sr-only">Edit term</span>
                      </Button>
                    )}

                    {/* Delete Term */}
                    {!isTermActive && !isTermCompleted && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Delete term"
                        onClick={() =>
                          onOpenConfirm({
                            title: `Delete term "${term.name}"?`,
                            description: `Are you sure you want to remove ${term.name}? This action cannot be undone.`,
                            actionLabel: "Delete Term",
                            isDestructive: true,
                            onConfirm: async () => {
                              await deleteTerm.mutateAsync(term.id);
                            },
                          })
                        }
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="sr-only">Delete term</span>
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <TermFormDialog
        open={formDialogState.open}
        onOpenChange={(open) => setFormDialogState((s) => ({ ...s, open }))}
        session={session}
        term={formDialogState.term}
        existingTerms={terms}
      />
    </div>
  );
}

// ── Academic Context Hero Banner ──────────────────────────────────────────────

function AcademicContextBanner({
  onNewSessionClick,
}: {
  onNewSessionClick: () => void;
}) {
  const contextQuery = useAcademicContext();
  const context = contextQuery.data;

  const currentSession = context?.session;
  const currentTerm = context?.term;

  const isConfigured = Boolean(currentSession && currentTerm);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Live School Status
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {isConfigured ? (
              <span>
                {currentSession?.name} Academic Session &bull; {currentTerm?.name}
              </span>
            ) : currentSession ? (
              <span>
                {currentSession.name} &bull;{" "}
                <span className="text-amber-500 font-normal">
                  No active term selected
                </span>
              </span>
            ) : (
              <span className="text-amber-500 font-normal">
                Academic Setup Incomplete
              </span>
            )}
          </h2>
          <p className="text-xs text-muted-foreground">
            {isConfigured
              ? "All active school workflows (enrollment, attendance, continuous assessment, and result grading) operate within this academic period."
              : "Activate an academic session and term below to enable enrollment and marks entry."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {currentSession && (
            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Current School Year
              </p>
              <p className="text-sm font-semibold text-foreground">
                {currentSession.name}
              </p>
            </div>
          )}

          {currentTerm && (
            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Current Term
              </p>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {currentTerm.name}
              </p>
            </div>
          )}

          <Button
            size="sm"
            onClick={onNewSessionClick}
            className="gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Session
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Sessions List Component ───────────────────────────────────────────────────

function SessionsList() {
  const { user } = useAuth();
  const isSuperAdmin =
    user?.role?.toLowerCase() === "super_admin" ||
    user?.role?.toLowerCase() === "superadmin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "UPCOMING" | "COMPLETED"
  >("ALL");
  const debouncedSearch = useDebouncedValue(search, 300);

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sessionDialog, setSessionDialog] = useState<{
    open: boolean;
    session?: AcademicSession;
  }>({ open: false });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
    open: false,
    title: "",
    description: "",
    actionLabel: "Confirm",
    onConfirm: async () => {},
  });

  const queryFilters = useMemo(() => {
    return {
      page,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    };
  }, [page, debouncedSearch, statusFilter]);

  const sessionsQuery = useAcademicSessions(queryFilters);
  const activateSession = useActivateAcademicSession();
  const deleteSession = useDeleteAcademicSession();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const data = sessionsQuery.data;
  const sessions = data?.data ?? [];
  const meta = data?.meta;

  // Auto-expand current active session on first load if none expanded
  useEffect(() => {
    if (expandedId === null && sessions.length > 0) {
      const active = sessions.find((s) => s.is_current);
      if (active) {
        setExpandedId(active.id);
      }
    }
  }, [sessions, expandedId]);

  return (
    <div className="space-y-5">
      <AcademicContextBanner
        onNewSessionClick={() => setSessionDialog({ open: true })}
      />

      {/* Filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search academic sessions…"
            className="pl-8 text-sm h-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Tab filter */}
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted/50 p-1 border border-border/50">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "ACTIVE", label: "Active" },
              { key: "UPCOMING", label: "Upcoming" },
              { key: "COMPLETED", label: "Completed" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "rounded px-2.5 py-1 text-xs font-medium transition-all",
                statusFilter === tab.key
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Query state handling */}
      {sessionsQuery.isPending && (
        <LoadingState label="Loading academic sessions…" />
      )}

      {sessionsQuery.isError && (
        <ErrorState
          error={sessionsQuery.error}
          onRetry={() => sessionsQuery.refetch()}
        />
      )}

      {!sessionsQuery.isPending && !sessionsQuery.isError && (
        <>
          {sessions.length === 0 ? (
            <EmptyState
              title={
                search || statusFilter !== "ALL"
                  ? "No matching academic sessions found"
                  : "No academic sessions created yet"
              }
              description={
                search || statusFilter !== "ALL"
                  ? "Try clearing filters to see existing sessions."
                  : "Academic sessions represent school years (e.g. 2026/2027). Create your first session to organize academic terms and enrollments."
              }
              action={
                <Button
                  size="sm"
                  onClick={() => {
                    if (search || statusFilter !== "ALL") {
                      setSearch("");
                      setStatusFilter("ALL");
                    } else {
                      setSessionDialog({ open: true });
                    }
                  }}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  {search || statusFilter !== "ALL"
                    ? "Reset Filters"
                    : "Create Session"}
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-10" />
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      School Year
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Start Date
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      End Date
                    </TableHead>
                    <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-right font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const status = normalizeSessionStatus(session);
                    const isCompleted = status === "COMPLETED";
                    const isActive = status === "ACTIVE";
                    const isExpanded = expandedId === session.id;

                    return (
                      <Fragment key={session.id}>
                        <TableRow
                          className={cn(
                            "group transition-colors",
                            isExpanded ? "bg-muted/10" : undefined,
                            isActive && "font-medium"
                          )}
                        >
                          <TableCell className="pl-3 pr-0">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedId(isExpanded ? null : session.id)
                              }
                              aria-label={
                                isExpanded ? "Collapse terms" : "Expand terms"
                              }
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-transform hover:bg-muted/60 hover:text-foreground"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </button>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {session.name}
                              </span>
                              {isActive && (
                                <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-1.5 font-bold">
                                  Current
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.start_date)}
                          </TableCell>

                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(session.end_date)}
                          </TableCell>

                          <TableCell>
                            <SessionStatusBadge session={session} />
                          </TableCell>

                          <TableCell className="space-x-1 text-right">
                            {/* Activate Session button */}
                            {!isActive && !isCompleted && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title: `Activate "${session.name}"?`,
                                    description: `Activating ${session.name} will transition it to ACTIVE and complete whichever academic session is currently running. Exactly one session may be active.`,
                                    actionLabel: "Activate Session",
                                    onConfirm: async () => {
                                      await activateSession.mutateAsync(session.id);
                                    },
                                  })
                                }
                              >
                                <Play className="h-3 w-3 mr-1 fill-current" />
                                Activate
                              </Button>
                            )}

                            {/* Edit Session button */}
                            {!isCompleted && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() =>
                                  setSessionDialog({ open: true, session })
                                }
                              >
                                <Pencil className="h-3.5 w-3.5 mr-1" />
                                Edit
                              </Button>
                            )}

                            {/* Delete Session button */}
                            {!isActive && !isCompleted && isSuperAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete session"
                                onClick={() =>
                                  setConfirmDialog({
                                    open: true,
                                    title: `Delete Session "${session.name}"?`,
                                    description: `Are you sure you want to delete session ${session.name}? This cannot be undone. Sessions with existing terms or dependent records must have those deleted first.`,
                                    actionLabel: "Delete Session",
                                    isDestructive: true,
                                    onConfirm: async () => {
                                      await deleteSession.mutateAsync(session.id);
                                    },
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Delete session</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Expanded terms panel */}
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="p-0">
                              <TermsPanel
                                session={session}
                                isParentActive={isActive}
                                onOpenConfirm={(config) =>
                                  setConfirmDialog({ ...config, open: true })
                                }
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {meta && meta.last_page > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Showing {sessions.length} of {meta.total} sessions
              </p>
              <PaginationControls
                page={meta.current_page}
                lastPage={meta.last_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <SessionFormDialog
        open={sessionDialog.open}
        onOpenChange={(open) => setSessionDialog((s) => ({ ...s, open }))}
        session={sessionDialog.session}
      />

      <ConfirmActionDialog
        state={confirmDialog}
        onOpenChange={(open) => setConfirmDialog((s) => ({ ...s, open }))}
      />
    </div>
  );
}

// ── Root Page Component ───────────────────────────────────────────────────────

export default function AcademicSessionsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Academic Sessions
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage academic sessions and their terms. Configure school years,
          track current progress, and organize marking periods.
        </p>
      </div>

      <AdminOnly>
        <SessionsList />
      </AdminOnly>
    </main>
  );
}

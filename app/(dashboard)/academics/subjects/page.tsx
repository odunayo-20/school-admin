"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
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
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useAssignSubjectToClass,
  useClasses,
  useClassSubjects,
  useCreateSubject,
  useDeleteSubject,
  useSubjects,
  useUpdateClassSubjectStatus,
  useUpdateSubject,
} from "@/lib/academics/queries";
import { useAuth } from "@/lib/auth/context";
import { canDeleteSubjects, canManageSubjects } from "@/lib/auth/permissions";
import { ApiError } from "@/lib/api/errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { ClassSubject, Subject } from "@/lib/academics/types";
import { cn } from "@/lib/utils";

// ── Badges ────────────────────────────────────────────────────────────────────

function SubjectStatusBadge({ status }: { status?: string }) {
  const norm = (status ?? "ACTIVE").toUpperCase();

  if (norm === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Active
      </span>
    );
  }

  if (norm === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
        Archived
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Inactive
    </span>
  );
}

// ── Subject Form Schema & Dialog ─────────────────────────────────────────────

const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required").max(100, "Name cannot exceed 100 characters"),
  code: z
    .string()
    .trim()
    .min(1, "Subject code is required")
    .max(20, "Code cannot exceed 20 characters")
    .regex(/^[A-Za-z0-9_-]+$/, "Code must only contain letters, numbers, hyphens or underscores"),
  sort_order: z.coerce.number().int().min(0, "Sort order must be 0 or higher").default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

type SubjectFormInput = z.input<typeof subjectSchema>;
type SubjectFormValues = z.output<typeof subjectSchema>;

function SubjectFormDialog({
  open,
  onOpenChange,
  subject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject;
}) {
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SubjectFormInput, unknown, SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      sort_order: 0,
      status: "ACTIVE",
    },
  });

  const nameValue = watch("name");

  // Auto-suggest code if adding a new subject and user hasn't explicitly set code
  useEffect(() => {
    if (!subject && nameValue && !watch("code")) {
      const parts = nameValue.trim().split(/\s+/);
      if (parts.length === 1 && parts[0].length >= 3) {
        setValue("code", parts[0].slice(0, 3).toUpperCase());
      } else if (parts.length >= 2) {
        const initials = parts.map((p) => p[0]).join("").slice(0, 4).toUpperCase();
        setValue("code", initials);
      }
    }
  }, [nameValue, subject, setValue, watch]);

  useEffect(() => {
    if (open) {
      if (subject) {
        reset({
          name: subject.name,
          code: subject.code,
          sort_order: subject.sort_order ?? 0,
          status: (subject.status as "ACTIVE" | "INACTIVE" | "ARCHIVED") ?? "ACTIVE",
        });
      } else {
        reset({
          name: "",
          code: "",
          sort_order: 0,
          status: "ACTIVE",
        });
      }
      setFormError(null);
    }
  }, [open, subject, reset]);

  const isPending = createSubject.isPending || updateSubject.isPending;

  async function onSubmit(values: SubjectFormValues) {
    setFormError(null);
    try {
      const payload = {
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        sort_order: values.sort_order,
        status: values.status,
      };

      if (subject) {
        await updateSubject.mutateAsync({ id: subject.id, data: payload });
      } else {
        await createSubject.mutateAsync(payload);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in subjectSchema.shape) {
            setError(field as keyof SubjectFormValues, { message: messages[0] });
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
            <BookOpen className="h-5 w-5 text-primary" />
            {subject ? "Edit Master Subject" : "Create Master Subject"}
          </DialogTitle>
          <DialogDescription>
            {subject
              ? "Update subject details in the school-wide academic catalogue."
              : "Register a reusable master subject that can be offered to instructional classes."}
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

          <div className="space-y-2">
            <Label htmlFor="subject-name">
              Subject Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject-name"
              placeholder="e.g. Mathematics, English Language, Physics"
              {...register("name")}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="subject-code">
                Subject Code <span className="text-destructive">*</span>
              </Label>
              <Input
                id="subject-code"
                placeholder="e.g. MTH, ENG, PHY"
                className="font-mono uppercase"
                {...register("code")}
              />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject-sort-order">Sort Order</Label>
              <Input
                id="subject-sort-order"
                type="number"
                min={0}
                placeholder="0"
                {...register("sort_order")}
              />
              {errors.sort_order && (
                <p className="text-xs text-destructive">{errors.sort_order.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject-status">Catalogue Status</Label>
            <Select id="subject-status" {...register("status")}>
              <option value="ACTIVE">Active (Available for curriculum)</option>
              <option value="INACTIVE">Inactive (Temporarily suspended)</option>
              <option value="ARCHIVED">Archived (Retired)</option>
            </Select>
            {errors.status && <p className="text-xs text-destructive">{errors.status.message}</p>}
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
              {isPending ? "Saving…" : subject ? "Update Subject" : "Create Subject"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Manage Class Offerings Dialog ───────────────────────────────────────────

function SubjectClassOfferingsDialog({
  open,
  onOpenChange,
  subject,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject;
}) {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [assignError, setAssignError] = useState<string | null>(null);

  const subjectId = subject?.id ?? 0;

  // Query offerings for this specific subject
  const offeringsQuery = useClassSubjects(
    subjectId > 0 ? { subject_id: subjectId, per_page: 100 } : undefined
  );
  // Query all active classes
  const classesQuery = useClasses({ active_only: true, per_page: 100 });

  const assignSubject = useAssignSubjectToClass(Number(selectedClassId));
  const updateOfferingStatus = useUpdateClassSubjectStatus();

  const offerings = offeringsQuery.data?.data ?? [];
  const allClasses = classesQuery.data?.data ?? [];

  // Filter available classes that do NOT yet offer this subject
  const offeredClassIds = useMemo(() => {
    return new Set(offerings.map((o) => o.school_class?.id).filter(Boolean));
  }, [offerings]);

  const availableClasses = useMemo(() => {
    return allClasses.filter((c) => !offeredClassIds.has(c.id));
  }, [allClasses, offeredClassIds]);

  async function handleAssignClass() {
    if (!selectedClassId || !subjectId) return;
    setAssignError(null);
    try {
      await assignSubject.mutateAsync(subjectId);
      setSelectedClassId("");
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : "Failed to assign subject to class.");
    }
  }

  async function handleToggleStatus(offering: ClassSubject) {
    const nextStatus = offering.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await updateOfferingStatus.mutateAsync({
        id: offering.id,
        status: nextStatus,
      });
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : "Failed to update offering status.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Class Offerings for {subject?.name}
            </DialogTitle>
            {subject && <SubjectStatusBadge status={subject.status} />}
          </div>
          <DialogDescription>
            Subject code: <span className="font-mono font-medium">{subject?.code}</span>. Manage
            which classes offer this subject in their curriculum.
          </DialogDescription>
        </DialogHeader>

        {assignError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{assignError}</p>
          </div>
        )}

        {/* Quick Assign Box */}
        <div className="rounded-lg border border-border/80 bg-muted/20 p-3.5 space-y-2.5">
          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Plus className="h-3.5 w-3.5 text-primary" />
            Assign Subject to a Class
          </Label>
          <div className="flex items-center gap-2">
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="flex-1 text-sm h-9"
              disabled={availableClasses.length === 0 || assignSubject.isPending}
            >
              <option value="">
                {availableClasses.length === 0
                  ? "All active classes already offer this subject"
                  : "Select an instructional class…"}
              </option>
              {availableClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                  {cls.class_level?.name ? ` — ${cls.class_level.name}` : ""}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              onClick={handleAssignClass}
              disabled={!selectedClassId || assignSubject.isPending}
              className="gap-1.5 shrink-0"
            >
              {assignSubject.isPending ? "Assigning…" : "Assign Class"}
            </Button>
          </div>
        </div>

        {/* Existing Offerings Table */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Current Offerings ({offerings.length})
            </span>
            <span className="text-[11px] text-muted-foreground">
              Offerings are permanent anchors; use status to activate/deactivate
            </span>
          </div>

          {offeringsQuery.isPending ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin inline-block mr-2" />
              Loading class offerings…
            </div>
          ) : offerings.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No classes currently offer this subject. Use the selector above to assign it.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border/70 divide-y divide-border/60 bg-card">
              {offerings.map((offering) => {
                const isActive = offering.status === "ACTIVE";
                const isPendingToggle = updateOfferingStatus.isPending;

                return (
                  <div
                    key={offering.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {offering.school_class?.name ?? "Class"}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            ({offering.school_class?.code ?? "N/A"})
                          </span>
                        </div>
                        {offering.school_class?.class_level?.name && (
                          <span className="text-xs text-muted-foreground">
                            Level: {offering.school_class.class_level.name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <SubjectStatusBadge status={offering.status} />
                      <Button
                        size="sm"
                        variant={isActive ? "outline" : "default"}
                        className="h-7 text-xs gap-1"
                        disabled={isPendingToggle}
                        onClick={() => handleToggleStatus(offering)}
                      >
                        {isActive ? (
                          <>
                            <ToggleLeft className="h-3.5 w-3.5 text-amber-500" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-3.5 w-3.5 text-emerald-500" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Subject Confirmation Dialog ───────────────────────────────────────

function DeleteSubjectDialog({
  open,
  onOpenChange,
  subject,
  onManageOfferings,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject?: Subject;
  onManageOfferings: (subject: Subject) => void;
}) {
  const deleteSubject = useDeleteSubject();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check offerings count
  const offeringsCount = subject?.class_subjects_count ?? 0;
  const hasOfferings = offeringsCount > 0;

  async function handleDelete() {
    if (!subject) return;
    setErrorMsg(null);
    try {
      await deleteSubject.mutateAsync(subject.id);
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to delete subject. Please ensure it has no class offerings.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Subject &quot;{subject?.name}&quot;?
          </DialogTitle>
          <DialogDescription className="pt-1">
            {hasOfferings ? (
              <span className="text-destructive font-medium block space-y-1">
                <span>
                  This subject is currently offered to {offeringsCount} class(es).
                </span>
                <span className="block text-xs text-muted-foreground font-normal">
                  In accordance with curriculum integrity rules, a subject cannot be deleted while
                  classes still offer it (active or inactive). You must remove or deactivate its class
                  offerings first.
                </span>
              </span>
            ) : (
              <span>
                Are you sure you want to permanently delete this master subject from the school catalogue?
                This action cannot be undone.
              </span>
            )}
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

        <DialogFooter className="pt-2 flex flex-col sm:flex-row gap-2">
          {hasOfferings && subject ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                onManageOfferings(subject);
              }}
              className="gap-1.5"
            >
              <Layers className="h-4 w-4 text-primary" />
              Manage Class Offerings
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteSubject.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={hasOfferings || deleteSubject.isPending}
          >
            {deleteSubject.isPending ? "Deleting…" : "Delete Subject"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Metrics Banner ────────────────────────────────────────────────────────────

function SubjectsMetricsBanner({
  subjects,
  totalSubjects,
  totalOfferings,
  onCreateSubject,
}: {
  subjects: Subject[];
  totalSubjects: number;
  totalOfferings: number;
  onCreateSubject: () => void;
}) {
  const activeCount = useMemo(() => {
    return subjects.filter((s) => (s.status ?? "ACTIVE") === "ACTIVE").length;
  }, [subjects]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Master Curriculum
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Subject Catalogue &amp; Class Offerings
          </h2>
          <p className="text-xs text-muted-foreground max-w-xl">
            Register reusable master subjects and assign them to instructional classes across the
            school. Offerings serve as anchor records for teacher assignments and assessments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Catalogue Subjects
            </p>
            <p className="text-sm font-semibold text-foreground">
              {totalSubjects}{" "}
              <span className="text-xs font-normal text-muted-foreground">total</span>
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Active Curriculum
            </p>
            <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {activeCount}{" "}
              <span className="text-xs font-normal text-muted-foreground">active</span>
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Class Allocations
            </p>
            <p className="text-sm font-semibold text-primary">{totalOfferings}</p>
          </div>

          <Button size="sm" onClick={onCreateSubject} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Subject
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Subjects List Component ───────────────────────────────────────────────────

function SubjectsList() {
  const { user } = useAuth();
  const canDelete = user ? canDeleteSubjects(user.role) : false;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED">("ALL");

  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Modal dialog states
  const [formDialogState, setFormDialogState] = useState<{
    open: boolean;
    subject?: Subject;
  }>({ open: false });

  const [offeringsDialogState, setOfferingsDialogState] = useState<{
    open: boolean;
    subject?: Subject;
  }>({ open: false });

  const [deleteDialogState, setDeleteDialogState] = useState<{
    open: boolean;
    subject?: Subject;
  }>({ open: false });

  // Main subjects query
  const subjectsQuery = useSubjects({
    page,
    per_page: 15,
    search: debouncedSearch.trim() || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  // Query overall class offerings count for statistics
  const classOfferingsMetaQuery = useClassSubjects({ per_page: 1 });
  const totalOfferings = classOfferingsMetaQuery.data?.meta?.total ?? 0;

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  if (subjectsQuery.isPending && !subjectsQuery.data) {
    return <LoadingState label="Loading subject catalogue…" />;
  }

  if (subjectsQuery.isError) {
    return (
      <ErrorState
        error={subjectsQuery.error}
        onRetry={() => subjectsQuery.refetch()}
      />
    );
  }

  const subjects = subjectsQuery.data?.data ?? [];
  const meta = subjectsQuery.data?.meta ?? {
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0,
  };

  const isFiltered = debouncedSearch.trim().length > 0 || statusFilter !== "ALL";

  return (
    <div className="space-y-5">
      {/* Top Banner Overview */}
      <SubjectsMetricsBanner
        subjects={subjects}
        totalSubjects={meta.total}
        totalOfferings={totalOfferings}
        onCreateSubject={() => setFormDialogState({ open: true })}
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 text-sm h-9"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED")
              }
              className="text-sm h-9"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
          </div>

          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchInput("");
                setStatusFilter("ALL");
              }}
              className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            >
              Reset
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          Showing {subjects.length} of {meta.total} subject{meta.total === 1 ? "" : "s"}
        </p>
      </div>

      {/* Subjects Table */}
      {subjects.length === 0 ? (
        <EmptyState
          title={isFiltered ? "No subjects match your filters." : "No subjects found in catalogue."}
          description={
            isFiltered
              ? "Try adjusting your search terms or status filter."
              : "Register your first master subject to begin offering it to classes."
          }
          action={
            isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchInput("");
                  setStatusFilter("ALL");
                }}
              >
                Clear Filters
              </Button>
            ) : (
              <Button size="sm" onClick={() => setFormDialogState({ open: true })}>
                <Plus className="h-4 w-4 mr-1.5" />
                Create Master Subject
              </Button>
            )
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-[30%]">Subject</TableHead>
                <TableHead className="w-[15%]">Code</TableHead>
                <TableHead className="w-[12%]">Sort Order</TableHead>
                <TableHead className="w-[15%]">Status</TableHead>
                <TableHead className="w-[18%]">Class Offerings</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((subject) => {
                const initials = subject.name.slice(0, 2).toUpperCase();

                return (
                  <TableRow key={subject.id} className="hover:bg-muted/30 transition-colors">
                    {/* Subject Name with avatar */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-xs text-primary">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{subject.name}</p>
                          <span className="text-[11px] text-muted-foreground">ID: #{subject.id}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Code */}
                    <TableCell>
                      <span className="inline-block rounded border border-border/70 bg-muted/60 px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                        {subject.code}
                      </span>
                    </TableCell>

                    {/* Sort Order */}
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {subject.sort_order ?? 0}
                      </span>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <SubjectStatusBadge status={subject.status} />
                    </TableCell>

                    {/* Class Offerings */}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setOfferingsDialogState({ open: true, subject })}
                        className="h-7 text-xs font-medium text-primary hover:text-primary/90 gap-1.5 px-2 bg-primary/5 hover:bg-primary/10"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        Manage Offerings
                      </Button>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormDialogState({ open: true, subject })}
                          className="h-8 w-8 p-0"
                          title={`Edit ${subject.name}`}
                          aria-label={`Edit ${subject.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteDialogState({ open: true, subject })}
                            className="h-8 w-8 p-0 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                            title={`Delete ${subject.name}`}
                            aria-label={`Delete ${subject.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination Controls */}
      {meta.last_page > 1 && (
        <PaginationControls
          page={meta.current_page}
          lastPage={meta.last_page}
          onPageChange={setPage}
        />
      )}

      {/* Dialogs */}
      <SubjectFormDialog
        open={formDialogState.open}
        onOpenChange={(open) => setFormDialogState((prev) => ({ ...prev, open }))}
        subject={formDialogState.subject}
      />

      <SubjectClassOfferingsDialog
        open={offeringsDialogState.open}
        onOpenChange={(open) => setOfferingsDialogState((prev) => ({ ...prev, open }))}
        subject={offeringsDialogState.subject}
      />

      <DeleteSubjectDialog
        open={deleteDialogState.open}
        onOpenChange={(open) => setDeleteDialogState((prev) => ({ ...prev, open }))}
        subject={deleteDialogState.subject}
        onManageOfferings={(subj) => setOfferingsDialogState({ open: true, subject: subj })}
      />
    </div>
  );
}

// ── Default Export ────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Subjects</h1>
        <p className="text-sm text-muted-foreground">
          Manage subjects that can be assigned to classes.
        </p>
      </div>
      <AdminOnly check={canManageSubjects}>
        <SubjectsList />
      </AdminOnly>
    </main>
  );
}

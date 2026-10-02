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
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  useClasses,
  useClassLevels,
  useCreateClass,
  useDeleteClass,
  useUpdateClass,
} from "@/lib/academics/queries";
import { useAuth } from "@/lib/auth/context";
import { ApiError } from "@/lib/api/errors";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import type { ClassLevel, SchoolClass } from "@/lib/academics/types";
import { cn } from "@/lib/utils";

// ── Badges ────────────────────────────────────────────────────────────────────

function ClassStatusBadge({ status }: { status?: string }) {
  const norm = (status ?? "ACTIVE").toUpperCase();

  if (norm === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
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
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Inactive
    </span>
  );
}

// ── Class Form Dialog (Create / Edit) ─────────────────────────────────────────

const classSchema = z.object({
  class_level_id: z.coerce
    .number()
    .int()
    .min(1, "Please select an academic level"),
  name: z.string().min(1, "Class name is required").max(100),
  code: z.string().min(1, "Class code is required").max(20),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

type ClassFormInput = z.input<typeof classSchema>;
type ClassFormValues = z.output<typeof classSchema>;

function ClassFormDialog({
  open,
  onOpenChange,
  schoolClass,
  defaultLevelId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass?: SchoolClass;
  defaultLevelId?: number;
}) {
  const createClass = useCreateClass();
  const updateClass = useUpdateClass(schoolClass?.id ?? 0);
  const classLevelsQuery = useClassLevels(1);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_level_id: 0,
      name: "",
      code: "",
      sort_order: 0,
      status: "ACTIVE",
    },
  });

  const nameValue = watch("name");

  // Auto-suggest code if adding a new class
  useEffect(() => {
    if (!schoolClass && nameValue && !watch("code")) {
      const parts = nameValue.trim().split(/\s+/);
      if (parts.length >= 2) {
        setValue("code", `${parts[0].slice(0, 3).toUpperCase()}-${parts[1]}`);
      }
    }
  }, [nameValue, schoolClass, setValue, watch]);

  useEffect(() => {
    if (open) {
      if (schoolClass) {
        reset({
          class_level_id: schoolClass.class_level_id,
          name: schoolClass.name,
          code: schoolClass.code,
          sort_order: schoolClass.sort_order ?? schoolClass.order ?? 0,
          status: (schoolClass.status as any) ?? "ACTIVE",
        });
      } else {
        reset({
          class_level_id: defaultLevelId ?? 0,
          name: "",
          code: "",
          sort_order: 0,
          status: "ACTIVE",
        });
      }
      setFormError(null);
    }
  }, [open, schoolClass, defaultLevelId, reset]);

  const isPending = createClass.isPending || updateClass.isPending;
  const classLevels = classLevelsQuery.data?.data ?? [];

  async function onSubmit(values: ClassFormValues) {
    setFormError(null);
    try {
      if (schoolClass) {
        await updateClass.mutateAsync({
          class_level_id: values.class_level_id,
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          sort_order: values.sort_order,
          status: values.status,
        });
      } else {
        await createClass.mutateAsync({
          class_level_id: values.class_level_id,
          name: values.name.trim(),
          code: values.code.trim().toUpperCase(),
          sort_order: values.sort_order,
          status: values.status,
        });
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in classSchema.shape) {
            setError(field as keyof ClassFormValues, { message: messages[0] });
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
            <GraduationCap className="h-5 w-5 text-primary" />
            {schoolClass ? "Edit Class" : "Create Instructional Class"}
          </DialogTitle>
          <DialogDescription>
            {schoolClass
              ? `Update class details, short code, and academic level for ${schoolClass.name}.`
              : "Define a class within an academic level, e.g. Primary 1, JSS 1, SSS 3."}
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
            <Label htmlFor="class-level">Academic Level <span className="text-destructive">*</span></Label>
            <Select id="class-level" {...register("class_level_id")}>
              <option value="0">Select a level…</option>
              {classLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name} ({lvl.code})
                </option>
              ))}
            </Select>
            {errors.class_level_id && (
              <p className="text-xs text-destructive">{errors.class_level_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="class-name">Class Name <span className="text-destructive">*</span></Label>
              <Input
                id="class-name"
                placeholder="e.g. Primary 5"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-code">Short Code <span className="text-destructive">*</span></Label>
              <Input
                id="class-code"
                placeholder="e.g. PRI-5"
                {...register("code")}
                aria-invalid={Boolean(errors.code)}
              />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class-order">Display Order</Label>
              <Input
                id="class-order"
                type="number"
                min={0}
                {...register("sort_order")}
              />
              <p className="text-[11px] text-muted-foreground">Orders classes in lists.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-status">Status</Label>
              <Select id="class-status" {...register("status")}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
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
              {isPending ? "Saving…" : schoolClass ? "Save Changes" : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Delete Confirmation Dialog ────────────────────────────────────────────────

function DeleteClassDialog({
  open,
  onOpenChange,
  schoolClass,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass: SchoolClass | null;
}) {
  const deleteClass = useDeleteClass();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (open) setErrorMsg(null);
  }, [open]);

  if (!schoolClass) return null;

  async function handleDelete() {
    setErrorMsg(null);
    try {
      await deleteClass.mutateAsync(schoolClass!.id);
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err instanceof ApiError ? err.message : "Failed to delete class.");
    }
  }

  const hasSections = (schoolClass.sections_count ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Class &quot;{schoolClass.name}&quot;?
          </DialogTitle>
          <DialogDescription className="pt-1">
            {hasSections ? (
              <span className="text-destructive font-medium">
                This class currently has {schoolClass.sections_count} section(s)/arm(s).
                A class with sections cannot be deleted. You must delete or move its sections first.
              </span>
            ) : (
              <span>
                Are you sure you want to delete this class? This action cannot be undone.
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

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteClass.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={hasSections || deleteClass.isPending}
          >
            {deleteClass.isPending ? "Deleting…" : "Delete Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Classes Overview Metrics Banner ───────────────────────────────────────────

function ClassesMetricsBanner({
  classes,
  classLevels,
  onNewClass,
}: {
  classes: SchoolClass[];
  classLevels: ClassLevel[];
  onNewClass: () => void;
}) {
  const totalSections = useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.sections_count ?? 0), 0);
  }, [classes]);

  const activeClassesCount = useMemo(() => {
    return classes.filter((c) => (c.status ?? "ACTIVE") === "ACTIVE").length;
  }, [classes]);

  return (
    <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instructional Structure
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Academic Classes &amp; Arms Overview
          </h2>
          <p className="text-xs text-muted-foreground">
            Classes are organized under Academic Levels (e.g. Nursery, Primary, JSS). Each class
            manages designated sections/arms and assigned subject offerings.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Classes
            </p>
            <p className="text-sm font-semibold text-foreground">
              {activeClassesCount} <span className="text-xs font-normal text-muted-foreground">active</span>
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Levels
            </p>
            <p className="text-sm font-semibold text-foreground">
              {classLevels.length}
            </p>
          </div>

          <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Sections / Arms
            </p>
            <p className="text-sm font-semibold text-primary">
              {totalSections}
            </p>
          </div>

          <Button size="sm" onClick={onNewClass} className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Create Class
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Classes List Component ────────────────────────────────────────────────────

function ClassesList() {
  const { user } = useAuth();
  const isAdmin =
    user?.role?.toLowerCase() === "super_admin" ||
    user?.role?.toLowerCase() === "superadmin" ||
    user?.role?.toLowerCase() === "admin";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "ARCHIVED">("ALL");

  const debouncedSearch = useDebouncedValue(search, 300);

  const [classFormDialog, setClassFormDialog] = useState<{
    open: boolean;
    schoolClass?: SchoolClass;
    defaultLevelId?: number;
  }>({ open: false });

  const [deleteTarget, setDeleteTarget] = useState<SchoolClass | null>(null);

  const classLevelsQuery = useClassLevels(1);
  const classLevels = classLevelsQuery.data?.data ?? [];

  const queryFilters = useMemo(() => {
    return {
      page,
      search: debouncedSearch.trim() || undefined,
      class_level_id: levelFilter === "ALL" ? undefined : levelFilter,
      status: statusFilter === "ALL" ? undefined : statusFilter,
    };
  }, [page, debouncedSearch, levelFilter, statusFilter]);

  const classesQuery = useClasses(queryFilters);

  // Reset page on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, levelFilter, statusFilter]);

  if (classesQuery.isPending && !classesQuery.data) {
    return <LoadingState label="Loading classes…" />;
  }

  if (classesQuery.isError) {
    return (
      <ErrorState
        error={classesQuery.error}
        onRetry={() => classesQuery.refetch()}
      />
    );
  }

  const classes = classesQuery.data?.data ?? [];
  const meta = classesQuery.data?.meta;

  return (
    <div className="space-y-5">
      <ClassesMetricsBanner
        classes={classes}
        classLevels={classLevels}
        onNewClass={() => setClassFormDialog({ open: true })}
      />

      {/* Filter toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-lg border border-border/70 bg-card p-3 shadow-xs">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or code…"
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

          {/* Academic Level filter */}
          <div className="flex items-center gap-1.5">
            <Label htmlFor="level-filter" className="text-xs text-muted-foreground whitespace-nowrap">
              Level:
            </Label>
            <Select
              id="level-filter"
              value={String(levelFilter)}
              onChange={(e) => {
                const val = e.target.value;
                setLevelFilter(val === "ALL" ? "ALL" : Number(val));
              }}
              className="h-9 text-xs w-40"
            >
              <option value="ALL">All Levels</option>
              {classLevels.map((lvl) => (
                <option key={lvl.id} value={lvl.id}>
                  {lvl.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex flex-wrap items-center gap-1 rounded-md bg-muted/50 p-1 border border-border/50 self-start md:self-auto">
          {(
            [
              { key: "ALL", label: "All" },
              { key: "ACTIVE", label: "Active" },
              { key: "INACTIVE", label: "Inactive" },
              { key: "ARCHIVED", label: "Archived" },
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

      {/* Table view */}
      {classes.length === 0 ? (
        <EmptyState
          title={
            search || levelFilter !== "ALL" || statusFilter !== "ALL"
              ? "No classes match your filters"
              : "No classes created yet"
          }
          description={
            search || levelFilter !== "ALL" || statusFilter !== "ALL"
              ? "Try adjusting search terms or clearing level/status filters."
              : "Create classes to organize students into instructional groups and assign course subjects."
          }
          action={
            <Button
              size="sm"
              onClick={() => {
                if (search || levelFilter !== "ALL" || statusFilter !== "ALL") {
                  setSearch("");
                  setLevelFilter("ALL");
                  setStatusFilter("ALL");
                } else {
                  setClassFormDialog({ open: true });
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {search || levelFilter !== "ALL" || statusFilter !== "ALL"
                ? "Reset Filters"
                : "Create First Class"}
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/80 bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Class Name
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Short Code
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Academic Level
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Sections / Arms
                </TableHead>
                <TableHead className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Order
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
              {classes.map((cls) => {
                const sectionsCount = cls.sections_count ?? 0;

                return (
                  <TableRow key={cls.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-semibold text-xs">
                          {cls.code?.slice(0, 3) || "CLS"}
                        </span>
                        <div>
                          <Link
                            href={`/academics/classes/${cls.id}`}
                            className="font-semibold text-sm text-foreground hover:underline hover:text-primary transition-colors"
                          >
                            {cls.name}
                          </Link>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted/60 text-foreground border border-border/60">
                        {cls.code}
                      </span>
                    </TableCell>

                    <TableCell>
                      {cls.class_level ? (
                        <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-0.5 text-xs text-foreground font-medium">
                          <GraduationCap className="h-3 w-3 text-muted-foreground" />
                          {cls.class_level.name}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/academics/classes/${cls.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Layers className="h-3.5 w-3.5" />
                        <span>
                          {sectionsCount} {sectionsCount === 1 ? "arm" : "arms"}
                        </span>
                      </Link>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      #{cls.sort_order ?? cls.order ?? 0}
                    </TableCell>

                    <TableCell>
                      <ClassStatusBadge status={cls.status} />
                    </TableCell>

                    <TableCell className="space-x-1 text-right">
                      <Link
                        href={`/academics/classes/${cls.id}`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "h-8 px-2.5 text-xs gap-1 border-border/80 shadow-2xs",
                        })}
                      >
                        <span>Manage</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                        title="Edit class settings"
                        onClick={() =>
                          setClassFormDialog({ open: true, schoolClass: cls })
                        }
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />
                        Edit
                      </Button>

                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          title={
                            sectionsCount > 0
                              ? "Cannot delete class with sections"
                              : "Delete class"
                          }
                          disabled={sectionsCount > 0}
                          onClick={() => setDeleteTarget(cls)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {classes.length} of {meta.total} classes
          </p>
          <PaginationControls
            page={meta.current_page}
            lastPage={meta.last_page}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Dialogs */}
      <ClassFormDialog
        open={classFormDialog.open}
        onOpenChange={(open) =>
          setClassFormDialog((s) => ({ ...s, open }))
        }
        schoolClass={classFormDialog.schoolClass}
        defaultLevelId={classFormDialog.defaultLevelId}
      />

      <DeleteClassDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        schoolClass={deleteTarget}
      />
    </div>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function ClassesPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Instructional Classes
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage classes, their sections/arms, and assigned subjects across academic levels.
        </p>
      </div>

      <AdminOnly>
        <ClassesList />
      </AdminOnly>
    </main>
  );
}

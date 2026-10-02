"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AdminOnly } from "@/components/auth/admin-only";
import { ClassRoster } from "@/components/academics/class-roster";
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
import { Select } from "@/components/ui/select";
import {
  useAcademicSessions,
  useAssignSubjectToClass,
  useClassDetail,
  useClassLevels,
  useCreateSection,
  useDeleteClass,
  useDeleteSection,
  useSubjects,
  useUnassignSubjectFromClass,
  useUpdateClass,
  useUpdateSection,
} from "@/lib/academics/queries";
import { useAuth } from "@/lib/auth/context";
import {
  useClassTeachersForClass,
  useSubjectTeachersForClass,
} from "@/lib/staff/queries";
import { ApiError } from "@/lib/api/errors";
import type { ClassDetail, Section, Subject } from "@/lib/academics/types";
import { cn } from "@/lib/utils";

// ── Status Badges ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
  const norm = (status ?? "ACTIVE").toUpperCase();

  if (norm === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    );
  }

  if (norm === "ARCHIVED") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/20 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        Archived
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      Inactive
    </span>
  );
}

// ── Edit Class Dialog ─────────────────────────────────────────────────────────

const classSchema = z.object({
  class_level_id: z.coerce.number().int().min(1, "Please select an academic level"),
  name: z.string().min(1, "Class name is required").max(100),
  code: z.string().min(1, "Class code is required").max(20),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

type ClassFormInput = z.input<typeof classSchema>;
type ClassFormValues = z.output<typeof classSchema>;

function EditClassDialog({
  open,
  onOpenChange,
  schoolClass,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolClass: ClassDetail;
}) {
  const updateClass = useUpdateClass(schoolClass.id);
  const classLevelsQuery = useClassLevels(1);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      class_level_id: schoolClass.class_level_id,
      name: schoolClass.name,
      code: schoolClass.code,
      sort_order: schoolClass.sort_order ?? schoolClass.order ?? 0,
      status: (schoolClass.status as any) ?? "ACTIVE",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        class_level_id: schoolClass.class_level_id,
        name: schoolClass.name,
        code: schoolClass.code,
        sort_order: schoolClass.sort_order ?? schoolClass.order ?? 0,
        status: (schoolClass.status as any) ?? "ACTIVE",
      });
      setFormError(null);
    }
  }, [open, schoolClass, reset]);

  const classLevels = classLevelsQuery.data?.data ?? [];

  async function onSubmit(values: ClassFormValues) {
    setFormError(null);
    try {
      await updateClass.mutateAsync({
        class_level_id: values.class_level_id,
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        sort_order: values.sort_order,
        status: values.status,
      });
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
            <Pencil className="h-5 w-5 text-primary" />
            Edit Class Settings
          </DialogTitle>
          <DialogDescription>
            Update class details, academic level, and status for {schoolClass.name}.
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
            <Label htmlFor="edit-class-level">Academic Level</Label>
            <Select id="edit-class-level" {...register("class_level_id")}>
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
              <Label htmlFor="edit-class-name">Class Name</Label>
              <Input id="edit-class-name" {...register("name")} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-class-code">Short Code</Label>
              <Input id="edit-class-code" {...register("code")} />
              {errors.code && (
                <p className="text-xs text-destructive">{errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-class-order">Display Order</Label>
              <Input id="edit-class-order" type="number" min={0} {...register("sort_order")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-class-status">Status</Label>
              <Select id="edit-class-status" {...register("status")}>
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
              disabled={updateClass.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateClass.isPending}>
              {updateClass.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Section (Arm) Form Dialog ─────────────────────────────────────────────────

const sectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(50),
  code: z.string().max(20).optional(),
  sort_order: z.coerce.number().int().min(0).default(0),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

type SectionFormInput = z.input<typeof sectionSchema>;
type SectionFormValues = z.output<typeof sectionSchema>;

function SectionDialog({
  open,
  onOpenChange,
  classId,
  className,
  section,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  className: string;
  section?: Section;
}) {
  const createSection = useCreateSection(classId);
  const updateSection = useUpdateSection(classId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    reset,
    watch,
    formState: { errors },
  } = useForm<SectionFormInput, unknown, SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      code: "",
      sort_order: 0,
      status: "ACTIVE",
    },
  });

  const nameVal = watch("name");

  // Auto-fill code if adding new section
  useEffect(() => {
    if (!section && nameVal && !watch("code")) {
      setValue("code", nameVal.trim().toUpperCase());
    }
  }, [nameVal, section, setValue, watch]);

  useEffect(() => {
    if (open) {
      if (section) {
        reset({
          name: section.name,
          code: section.code || section.name,
          sort_order: section.sort_order ?? 0,
          status: (section.status as any) ?? "ACTIVE",
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
  }, [open, section, reset]);

  const isPending = createSection.isPending || updateSection.isPending;

  async function onSubmit(values: SectionFormValues) {
    setFormError(null);
    try {
      if (section) {
        await updateSection.mutateAsync({
          id: section.id,
          data: {
            name: values.name.trim(),
            code: (values.code || values.name).trim().toUpperCase(),
            sort_order: values.sort_order,
            status: values.status,
          },
        });
      } else {
        await createSection.mutateAsync({
          name: values.name.trim(),
          code: (values.code || values.name).trim().toUpperCase(),
          sort_order: values.sort_order,
          status: values.status,
        });
      }
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          if (field in sectionSchema.shape) {
            setError(field as keyof SectionFormValues, { message: messages[0] });
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
            {section ? `Edit Section / Arm` : `Add Section / Arm to ${className}`}
          </DialogTitle>
          <DialogDescription>
            {section
              ? `Update details for section ${section.name}.`
              : "Arms represent student cohorts within this class (e.g. A, B, Gold, Diamond)."}
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="sec-name">Section / Arm Name <span className="text-destructive">*</span></Label>
              <Input
                id="sec-name"
                placeholder="e.g. A or Gold"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-code">Short Code</Label>
              <Input
                id="sec-code"
                placeholder="e.g. A"
                {...register("code")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sec-order">Display Order</Label>
              <Input id="sec-order" type="number" min={0} {...register("sort_order")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sec-status">Status</Label>
              <Select id="sec-status" {...register("status")}>
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
              {isPending ? "Saving…" : section ? "Save Changes" : "Create Section"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Assign Subject Dialog ─────────────────────────────────────────────────────

function AssignSubjectDialog({
  open,
  onOpenChange,
  classId,
  assignedSubjectIds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId: number;
  assignedSubjectIds: number[];
}) {
  const subjectsQuery = useSubjects(1);
  const assignSubject = useAssignSubjectToClass(classId);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const availableSubjects = useMemo(() => {
    const all = subjectsQuery.data?.data ?? [];
    return all.filter((s) => !assignedSubjectIds.includes(s.id));
  }, [subjectsQuery.data?.data, assignedSubjectIds]);

  const filteredSubjects = useMemo(() => {
    if (!searchTerm.trim()) return availableSubjects;
    const q = searchTerm.toLowerCase().trim();
    return availableSubjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)
    );
  }, [availableSubjects, searchTerm]);

  async function handleAssign(subjectId: number) {
    setFormError(null);
    try {
      await assignSubject.mutateAsync(subjectId);
      setSelectedSubjectId("");
      onOpenChange(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Failed to assign subject.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Assign Subject Offering
          </DialogTitle>
          <DialogDescription>
            Select a course subject from the school catalog to offer to this class.
          </DialogDescription>
        </DialogHeader>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{formError}</p>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter subjects by name or code…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm h-9"
            />
          </div>

          {availableSubjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              All active subjects in the catalog are already offered to this class.
            </div>
          ) : filteredSubjects.length === 0 ? (
            <p className="text-center py-4 text-xs text-muted-foreground">
              No subjects match &quot;{searchTerm}&quot;.
            </p>
          ) : (
            <div className="max-h-60 overflow-y-auto divide-y divide-border/60 rounded-md border border-border/80 bg-card">
              {filteredSubjects.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-2.5 hover:bg-muted/20 transition-colors"
                >
                  <div>
                    <span className="font-medium text-sm text-foreground">{sub.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted-foreground">({sub.code})</span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    disabled={assignSubject.isPending}
                    onClick={() => handleAssign(sub.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Generic Confirmation Modal ────────────────────────────────────────────────

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void>;
}

function ConfirmationModal({
  state,
  onOpenChange,
}: {
  state: ConfirmDialogState;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (state.open) setErrorMsg(null);
  }, [state.open]);

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

// ── Main Content Component ────────────────────────────────────────────────────

function ClassDetailContent({ classId }: { classId: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin =
    user?.role?.toLowerCase() === "super_admin" ||
    user?.role?.toLowerCase() === "superadmin" ||
    user?.role?.toLowerCase() === "admin";

  const classQuery = useClassDetail(classId);
  const deleteClassMutation = useDeleteClass();
  const unassignSubject = useUnassignSubjectFromClass(classId);
  const deleteSectionMutation = useDeleteSection(classId);

  const [editClassOpen, setEditClassOpen] = useState(false);
  const [sectionDialog, setSectionDialog] = useState<{
    open: boolean;
    section?: Section;
  }>({ open: false });
  const [assignSubjectOpen, setAssignSubjectOpen] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    actionLabel: "Confirm",
    onConfirm: async () => {},
  });

  // Session Selector
  const sessionsQuery = useAcademicSessions(1);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  const defaultSessionId = sessionsQuery.data
    ? ((sessionsQuery.data.data.find((s) => s.is_current) ?? sessionsQuery.data.data[0])?.id ?? 0)
    : 0;
  const sessionId = selectedSessionId ?? defaultSessionId;

  const classTeachersQuery = useClassTeachersForClass(classId, sessionId);
  const subjectTeachersQuery = useSubjectTeachersForClass(classId, sessionId);

  const teacherBySubjectId = useMemo(() => {
    return new Map(
      (subjectTeachersQuery.data ?? []).map((assignment) => [
        assignment.subject.id,
        assignment.staff,
      ])
    );
  }, [subjectTeachersQuery.data]);

  if (classQuery.isPending) return <LoadingState label="Loading class details…" />;
  if (classQuery.isError) {
    return (
      <ErrorState
        error={classQuery.error}
        onRetry={() => classQuery.refetch()}
      />
    );
  }

  const schoolClass = classQuery.data;
  const sections = schoolClass.sections ?? [];
  const subjects = schoolClass.subjects ?? [];

  return (
    <div className="space-y-6">
      {/* Hero Class Banner */}
      <div className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary">
                <GraduationCap className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Class Workspace
              </span>
              <StatusBadge status={schoolClass.status} />
            </div>

            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {schoolClass.name}
              </h2>
              <span className="font-mono text-sm font-semibold px-2.5 py-0.5 rounded bg-muted text-foreground border border-border">
                {schoolClass.code}
              </span>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span>Academic Level:</span>
              <span className="font-semibold text-foreground">
                {schoolClass.class_level?.name ?? "General"}
              </span>
              <span>&bull;</span>
              <span>Display Order #{schoolClass.sort_order ?? schoolClass.order ?? 0}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Sections / Arms
              </p>
              <p className="text-sm font-semibold text-foreground">
                {sections.length}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-background/80 px-3.5 py-2">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Assigned Subjects
              </p>
              <p className="text-sm font-semibold text-foreground">
                {subjects.length}
              </p>
            </div>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 shadow-2xs"
              onClick={() => setEditClassOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Settings
            </Button>

            {isAdmin && (
              <Button
                size="sm"
                variant="ghost"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title={
                  sections.length > 0
                    ? "Delete sections before deleting class"
                    : "Delete class"
                }
                disabled={sections.length > 0}
                onClick={() =>
                  setConfirmDialog({
                    open: true,
                    title: `Delete Class "${schoolClass.name}"?`,
                    description: `Are you sure you want to delete this class? This cannot be undone.`,
                    actionLabel: "Delete Class",
                    isDestructive: true,
                    onConfirm: async () => {
                      await deleteClassMutation.mutateAsync(schoolClass.id);
                      router.push("/academics/classes");
                    },
                  })
                }
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete class</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Sections / Arms & Subjects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sections / Arms Card */}
        <div className="space-y-3.5 rounded-xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Sections / Arms</h3>
              <Badge variant="outline" className="text-xs">
                {sections.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={() => setSectionDialog({ open: true })}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Arm
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Student enrollments and attendance are tracked at the section/arm level.
          </p>

          {sections.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <Layers className="mx-auto h-6 w-6 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">No sections created</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Add arms such as A, B, Gold, or Diamond to enroll students into this class.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSectionDialog({ open: true })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add First Arm
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70 divide-y divide-border/60">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                      {section.code || section.name.slice(0, 2)}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {section.name}
                        </span>
                        {section.code && section.code !== section.name && (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            ({section.code})
                          </span>
                        )}
                        <StatusBadge status={section.status} />
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Order #{section.sort_order ?? 0}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      title="Edit section"
                      onClick={() => setSectionDialog({ open: true, section })}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span className="sr-only">Edit section</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Delete section"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: `Delete section "${section.name}"?`,
                          description: `Are you sure you want to delete section ${section.name}? A section with existing student enrollments cannot be deleted.`,
                          actionLabel: "Delete Section",
                          isDestructive: true,
                          onConfirm: async () => {
                            await deleteSectionMutation.mutateAsync(section.id);
                          },
                        })
                      }
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span className="sr-only">Delete section</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subjects Offering Card */}
        <div className="space-y-3.5 rounded-xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Course Subjects</h3>
              <Badge variant="outline" className="text-xs">
                {subjects.length}
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              onClick={() => setAssignSubjectOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Assign Subject
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Subjects offered to this class. Grades, continuous assessments, and reports rely on these offerings.
          </p>

          {subjects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-muted-foreground/60 mb-2" />
              <p className="text-sm font-medium text-foreground">No subjects assigned yet</p>
              <p className="text-xs text-muted-foreground mt-0.5 mb-3">
                Assign subjects from your school curriculum catalog to this class.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAssignSubjectOpen(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Assign Course Subject
              </Button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70 divide-y divide-border/60 max-h-80 overflow-y-auto">
              {subjects.map((subject) => {
                const teacher = teacherBySubjectId.get(subject.id);

                return (
                  <div
                    key={subject.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/20 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-foreground">
                          {subject.name}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          ({subject.code})
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <UserCheck className="h-3 w-3 text-muted-foreground" />
                        {teacher ? (
                          <Link
                            href={`/staff/${teacher.id}`}
                            className="hover:underline text-foreground font-medium"
                          >
                            {teacher.name}
                          </Link>
                        ) : (
                          <span className="italic text-muted-foreground">
                            No teacher assigned for this session
                          </span>
                        )}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() =>
                        setConfirmDialog({
                          open: true,
                          title: `Unassign "${subject.name}"?`,
                          description: `This will mark the offering as INACTIVE for this class. Historical scores and records will remain preserved.`,
                          actionLabel: "Unassign Subject",
                          isDestructive: true,
                          onConfirm: async () => {
                            await unassignSubject.mutateAsync(subject.id);
                          },
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Class Teachers & Form Masters Section */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">Class &amp; Form Teachers</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Staff members designated with supervisory oversight for whole class or designated sections.
            </p>
          </div>

          {sessionsQuery.data && sessionsQuery.data.data.length > 0 && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <Label htmlFor="session-picker" className="text-xs text-muted-foreground">
                Session:
              </Label>
              <Select
                id="session-picker"
                className="w-40 h-8 text-xs"
                value={String(sessionId)}
                onChange={(e) => setSelectedSessionId(Number(e.target.value))}
              >
                {sessionsQuery.data.data.map((sess) => (
                  <option key={sess.id} value={sess.id}>
                    {sess.name} {sess.is_current ? "(Current)" : ""}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {classTeachersQuery.isPending && <LoadingState label="Loading teacher assignments…" />}
        {classTeachersQuery.isError && <ErrorState error={classTeachersQuery.error} />}

        {classTeachersQuery.isSuccess && classTeachersQuery.data.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
            No dedicated class teachers assigned for this academic session yet.
            Teaching staff assignments can be managed under Staff &gt; Teacher Assignments.
          </div>
        )}

        {classTeachersQuery.isSuccess && classTeachersQuery.data.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {classTeachersQuery.data.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-border/70 bg-muted/20 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    {assignment.section ? `Arm ${assignment.section.name}` : "Whole Class"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {assignment.staff ? (
                      <Link
                        href={`/staff/${assignment.staff.id}`}
                        className="text-primary hover:underline font-medium"
                      >
                        {assignment.staff.name}
                      </Link>
                    ) : (
                      "Unassigned"
                    )}
                  </p>
                </div>
                <UserCheck className="h-4 w-4 text-emerald-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Roster Section */}
      <div className="rounded-xl border border-border/80 bg-card p-5 shadow-xs">
        <ClassRoster
          classId={schoolClass.id}
          academicSessionId={sessionId}
          sections={sections}
        />
      </div>

      {/* Dialogs */}
      <EditClassDialog
        open={editClassOpen}
        onOpenChange={setEditClassOpen}
        schoolClass={schoolClass}
      />

      <SectionDialog
        open={sectionDialog.open}
        onOpenChange={(open) => setSectionDialog((s) => ({ ...s, open }))}
        classId={schoolClass.id}
        className={schoolClass.name}
        section={sectionDialog.section}
      />

      <AssignSubjectDialog
        open={assignSubjectOpen}
        onOpenChange={setAssignSubjectOpen}
        classId={schoolClass.id}
        assignedSubjectIds={subjects.map((s) => s.id)}
      />

      <ConfirmationModal
        state={confirmDialog}
        onOpenChange={(open) => setConfirmDialog((s) => ({ ...s, open }))}
      />
    </div>
  );
}

// ── Root Page ─────────────────────────────────────────────────────────────────

export default function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const classId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8 max-w-7xl mx-auto">
      <div>
        <Link
          href="/academics/classes"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Classes</span>
        </Link>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Manage Class Structure
        </h1>
      </div>

      <AdminOnly>
        <ClassDetailContent classId={classId} />
      </AdminOnly>
    </main>
  );
}

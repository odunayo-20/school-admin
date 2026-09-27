"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  useCreateGradingScale,
  useDeleteGradingScale,
  useGradingScales,
  useUpdateGradingScale,
} from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { GradingScale } from "@/lib/academics/types";

const gradingSchema = z.object({
  grade: z.string().min(1, "Grade is required").max(10),
  min_score: z.coerce.number().min(0).max(100),
  max_score: z.coerce.number().min(0).max(100),
  grade_point: z.coerce.number().min(0),
  remark: z.string().max(100).optional().or(z.literal("")),
});
type GradingFormInput = z.input<typeof gradingSchema>;
type GradingFormValues = z.output<typeof gradingSchema>;

function GradingFormDialog({
  open,
  onOpenChange,
  scale,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scale?: GradingScale;
}) {
  const createScale = useCreateGradingScale();
  const updateScale = useUpdateGradingScale();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GradingFormInput, unknown, GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: scale?.grade ?? "",
      min_score: scale?.min_score ?? 0,
      max_score: scale?.max_score ?? 0,
      grade_point: scale?.grade_point ?? 0,
      remark: scale?.remark ?? "",
    },
  });

  const isPending = createScale.isPending || updateScale.isPending;

  async function onSubmit(values: GradingFormValues) {
    setFormError(null);
    const payload = { ...values, remark: values.remark || null };
    try {
      if (scale) {
        await updateScale.mutateAsync({ id: scale.id, data: payload });
      } else {
        await createScale.mutateAsync(payload);
      }
      reset();
      onOpenChange(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{scale ? "Edit grade" : "Create grade"}</DialogTitle>
          <DialogDescription>e.g. A, 70–100, 5.0 grade point</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="grade">Grade</Label>
            <Input id="grade" placeholder="A" {...register("grade")} />
            {errors.grade && <p className="text-sm text-destructive">{errors.grade.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min-score">Min score</Label>
              <Input id="min-score" type="number" {...register("min_score")} />
              {errors.min_score && <p className="text-sm text-destructive">{errors.min_score.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-score">Max score</Label>
              <Input id="max-score" type="number" {...register("max_score")} />
              {errors.max_score && <p className="text-sm text-destructive">{errors.max_score.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="grade-point">Grade point</Label>
            <Input id="grade-point" type="number" step="0.1" {...register("grade_point")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="remark">Remark</Label>
            <Input id="remark" placeholder="Excellent" {...register("remark")} />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GradingList() {
  const [dialogState, setDialogState] = useState<{ open: boolean; scale?: GradingScale }>({ open: false });
  const gradingQuery = useGradingScales();
  const deleteScale = useDeleteGradingScale();

  if (gradingQuery.isPending) return <LoadingState label="Loading grading configuration…" />;
  if (gradingQuery.isError) {
    return <ErrorState error={gradingQuery.error} onRetry={() => gradingQuery.refetch()} />;
  }

  const scales = gradingQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setDialogState({ open: true })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add grade
        </Button>
      </div>

      {scales.length === 0 ? (
        <EmptyState
          title="No grading configuration yet."
          description="Define grade bands such as A (70–100)."
          action={<Button size="sm" onClick={() => setDialogState({ open: true })}>Add Grade</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Grade</TableHead>
              <TableHead>Score range</TableHead>
              <TableHead>Grade point</TableHead>
              <TableHead>Remark</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scales.map((scale) => (
              <TableRow key={scale.id}>
                <TableCell className="font-medium">{scale.grade}</TableCell>
                <TableCell>
                  {scale.min_score}–{scale.max_score}
                </TableCell>
                <TableCell>{scale.grade_point}</TableCell>
                <TableCell>{scale.remark ?? "—"}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, scale })}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteScale.isPending}
                    onClick={() => deleteScale.mutate(scale.id)}
                    aria-label={`Delete grade ${scale.grade}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <GradingFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        scale={dialogState.scale}
      />
    </div>
  );
}

export default function GradingSettingsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Grading Configuration</h1>
        <p className="text-sm text-muted-foreground">Define the grade bands used across the school.</p>
      </div>
      <AdminOnly>
        <GradingList />
      </AdminOnly>
    </main>
  );
}

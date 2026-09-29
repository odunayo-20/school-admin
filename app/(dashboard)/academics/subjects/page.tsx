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
import { PaginationControls } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCreateSubject, useDeleteSubject, useSubjects, useUpdateSubject } from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { Subject } from "@/lib/academics/types";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(100),
  code: z.string().min(1, "Subject code is required").max(20),
});
type SubjectFormValues = z.infer<typeof subjectSchema>;

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
    formState: { errors },
  } = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: { name: subject?.name ?? "", code: subject?.code ?? "" },
  });

  const isPending = createSubject.isPending || updateSubject.isPending;

  async function onSubmit(values: SubjectFormValues) {
    setFormError(null);
    try {
      if (subject) {
        await updateSubject.mutateAsync({ id: subject.id, data: values });
      } else {
        await createSubject.mutateAsync(values);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{subject ? "Edit subject" : "Create subject"}</DialogTitle>
          <DialogDescription>e.g. Mathematics (MTH)</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="subject-name">Subject name</Label>
            <Input id="subject-name" placeholder="Mathematics" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="subject-code">Subject code</Label>
            <Input id="subject-code" placeholder="MTH" {...register("code")} />
            {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubjectsList() {
  const [page, setPage] = useState(1);
  const [dialogState, setDialogState] = useState<{ open: boolean; subject?: Subject }>({ open: false });
  const subjectsQuery = useSubjects(page);
  const deleteSubject = useDeleteSubject();

  if (subjectsQuery.isPending) return <LoadingState label="Loading subjects…" />;
  if (subjectsQuery.isError) {
    return <ErrorState error={subjectsQuery.error} onRetry={() => subjectsQuery.refetch()} />;
  }

  const { data: subjects, meta } = subjectsQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta.total} subject{meta.total === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setDialogState({ open: true })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create subject
        </Button>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          title="No subjects found."
          action={<Button size="sm" onClick={() => setDialogState({ open: true })}>Create Subject</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell>{subject.code}</TableCell>
                <TableCell className="space-x-1 text-right">
                  <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, subject })}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deleteSubject.isPending}
                    onClick={() => deleteSubject.mutate(subject.id)}
                    aria-label={`Delete ${subject.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {subjects.length > 0 && (
        <PaginationControls page={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
      )}

      <SubjectFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        subject={dialogState.subject}
      />
    </div>
  );
}

export default function SubjectsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Subjects</h1>
        <p className="text-sm text-muted-foreground">Manage subjects that can be assigned to classes.</p>
      </div>
      <AdminOnly>
        <SubjectsList />
      </AdminOnly>
    </main>
  );
}

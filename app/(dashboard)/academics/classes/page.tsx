"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus } from "lucide-react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useClasses, useCreateClass } from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";

const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  order: z.coerce.number().int().min(0, "Order must be 0 or greater"),
});
type ClassFormInput = z.input<typeof classSchema>;
type ClassFormValues = z.output<typeof classSchema>;

function CreateClassDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createClass = useCreateClass();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", order: 0 },
  });

  async function onSubmit(values: ClassFormValues) {
    setFormError(null);
    try {
      await createClass.mutateAsync(values);
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
          <DialogTitle>Create class</DialogTitle>
          <DialogDescription>e.g. Primary 1, JSS 1</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="class-name">Class name</Label>
            <Input id="class-name" placeholder="Primary 1" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-order">Display order</Label>
            <Input id="class-order" type="number" {...register("order")} />
            {errors.order && <p className="text-sm text-destructive">{errors.order.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={createClass.isPending}>
            {createClass.isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ClassesList() {
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const classesQuery = useClasses(page);

  if (classesQuery.isPending) return <LoadingState label="Loading classes…" />;
  if (classesQuery.isError) {
    return <ErrorState error={classesQuery.error} onRetry={() => classesQuery.refetch()} />;
  }

  const { data: classes, meta } = classesQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta.total} class{meta.total === 1 ? "" : "es"}
        </p>
        <Button size="sm" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create class
        </Button>
      </div>

      {classes.length === 0 ? (
        <EmptyState
          title="No classes found."
          description="Create your school's classes, e.g. Primary 1, JSS 1."
          action={<Button size="sm" onClick={() => setDialogOpen(true)}>Create Class</Button>}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.map((schoolClass) => (
              <TableRow key={schoolClass.id}>
                <TableCell className="font-medium">{schoolClass.name}</TableCell>
                <TableCell>{schoolClass.sections_count ?? "—"}</TableCell>
                <TableCell>{schoolClass.subjects_count ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/academics/classes/${schoolClass.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Manage
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {classes.length > 0 && (
        <PaginationControls page={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
      )}

      <CreateClassDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

export default function ClassesPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Classes</h1>
        <p className="text-sm text-muted-foreground">
          Manage classes, their sections/arms, and assigned subjects.
        </p>
      </div>
      <AdminOnly>
        <ClassesList />
      </AdminOnly>
    </main>
  );
}

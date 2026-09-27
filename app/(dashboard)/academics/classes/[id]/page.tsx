"use client";

import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  useAssignSubjectToClass,
  useClassDetail,
  useCreateSection,
  useDeleteSection,
  useSubjects,
  useUnassignSubjectFromClass,
  useUpdateClass,
  useUpdateSection,
} from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { Section } from "@/lib/academics/types";

const classSchema = z.object({
  name: z.string().min(1, "Class name is required").max(100),
  order: z.coerce.number().int().min(0),
});
type ClassFormInput = z.input<typeof classSchema>;
type ClassFormValues = z.output<typeof classSchema>;

function ClassDetailsForm({ classId, name, order }: { classId: number; name: string; order: number }) {
  const updateClass = useUpdateClass(classId);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassFormInput, unknown, ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name, order },
  });

  async function onSubmit(values: ClassFormValues) {
    setFormError(null);
    try {
      await updateClass.mutateAsync(values);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Something went wrong.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-wrap items-end gap-3">
      {formError && <p className="w-full text-sm text-destructive">{formError}</p>}
      <div className="space-y-2">
        <Label htmlFor="class-name">Class name</Label>
        <Input id="class-name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="class-order">Display order</Label>
        <Input id="class-order" type="number" className="w-28" {...register("order")} />
      </div>
      <Button type="submit" disabled={updateClass.isPending}>
        {updateClass.isPending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}

const sectionSchema = z.object({ name: z.string().min(1, "Section name is required").max(50) });
type SectionFormValues = z.infer<typeof sectionSchema>;

function AddSectionForm({ classId }: { classId: number }) {
  const createSection = useCreateSection(classId);
  const { register, handleSubmit, reset } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "" },
  });

  async function onSubmit(values: SectionFormValues) {
    await createSection.mutateAsync(values);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor="section-name" className="sr-only">
          New section name
        </Label>
        <Input id="section-name" placeholder="Section name, e.g. A" {...register("name")} />
      </div>
      <Button type="submit" size="sm" disabled={createSection.isPending}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add
      </Button>
    </form>
  );
}

function SectionRow({ classId, section }: { classId: number; section: Section }) {
  const updateSection = useUpdateSection(classId);
  const deleteSection = useDeleteSection(classId);
  const [editing, setEditing] = useState(false);
  const { register, handleSubmit } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: section.name },
  });

  if (editing) {
    return (
      <form
        onSubmit={handleSubmit(async (values) => {
          await updateSection.mutateAsync({ id: section.id, data: values });
          setEditing(false);
        })}
        className="flex items-center gap-2 px-3 py-2"
      >
        <Input {...register("name")} className="h-8" />
        <Button type="submit" size="sm" disabled={updateSection.isPending}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <li className="flex items-center justify-between px-3 py-2 text-sm">
      <span>{section.name}</span>
      <span className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={deleteSection.isPending}
          onClick={() => deleteSection.mutate(section.id)}
          aria-label={`Delete ${section.name}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      </span>
    </li>
  );
}

function SubjectAssignment({ classId, assignedSubjectIds }: { classId: number; assignedSubjectIds: number[] }) {
  const subjectsQuery = useSubjects(1);
  const assignSubject = useAssignSubjectToClass(classId);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");

  if (subjectsQuery.isPending) return <LoadingState label="Loading subjects…" />;
  if (subjectsQuery.isError) return <ErrorState error={subjectsQuery.error} />;

  const availableSubjects = subjectsQuery.data.data.filter(
    (subject) => !assignedSubjectIds.includes(subject.id)
  );

  if (availableSubjects.length === 0) {
    return <p className="text-sm text-muted-foreground">All subjects are already assigned to this class.</p>;
  }

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!selectedSubjectId) return;
        await assignSubject.mutateAsync(Number(selectedSubjectId));
        setSelectedSubjectId("");
      }}
    >
      <div className="w-56 space-y-1">
        <Label htmlFor="subject-select" className="sr-only">
          Subject to assign
        </Label>
        <Select
          id="subject-select"
          value={selectedSubjectId}
          onChange={(event) => setSelectedSubjectId(event.target.value)}
        >
          <option value="">Select a subject…</option>
          {availableSubjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={!selectedSubjectId || assignSubject.isPending}>
        <Plus className="h-4 w-4" aria-hidden="true" />
        Assign
      </Button>
    </form>
  );
}

function ClassDetailContent({ classId }: { classId: number }) {
  const classQuery = useClassDetail(classId);
  const unassignSubject = useUnassignSubjectFromClass(classId);

  if (classQuery.isPending) return <LoadingState label="Loading class…" />;
  if (classQuery.isError) return <ErrorState error={classQuery.error} onRetry={() => classQuery.refetch()} />;

  const schoolClass = classQuery.data;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Class details</h2>
        <ClassDetailsForm classId={schoolClass.id} name={schoolClass.name} order={schoolClass.order} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Sections / Arms</h2>
        {schoolClass.sections.length === 0 ? (
          <EmptyState title="No sections yet." description="Add sections such as A, B, C." />
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {schoolClass.sections.map((section) => (
              <SectionRow key={section.id} classId={schoolClass.id} section={section} />
            ))}
          </ul>
        )}
        <AddSectionForm classId={schoolClass.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Subjects assigned to this class</h2>
        {schoolClass.subjects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No subjects assigned yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-md border border-border bg-card">
            {schoolClass.subjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span>
                  {subject.name} <span className="text-muted-foreground">({subject.code})</span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={unassignSubject.isPending}
                  onClick={() => unassignSubject.mutate(subject.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
        <SubjectAssignment
          classId={schoolClass.id}
          assignedSubjectIds={schoolClass.subjects.map((s) => s.id)}
        />
      </section>
    </div>
  );
}

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const classId = Number(id);

  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <Link href="/academics/classes" className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to classes
        </Link>
        <h1 className="mt-1 text-lg font-semibold">Manage class</h1>
      </div>
      <AdminOnly>
        <ClassDetailContent classId={classId} />
      </AdminOnly>
    </main>
  );
}

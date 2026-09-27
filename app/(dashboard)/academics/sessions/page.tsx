"use client";

import { Fragment, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
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
import {
  useAcademicSessions,
  useActivateAcademicSession,
  useCreateAcademicSession,
  useCreateTerm,
  useTerms,
  useUpdateAcademicSession,
  useUpdateTerm,
} from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type { AcademicSession, Term } from "@/lib/academics/types";

const sessionSchema = z.object({
  name: z.string().min(1, "Session name is required").max(50),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
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
      name: session?.name ?? "",
      start_date: session?.start_date ?? "",
      end_date: session?.end_date ?? "",
    },
  });

  const isPending = createSession.isPending || updateSession.isPending;

  async function onSubmit(values: SessionFormValues) {
    setFormError(null);
    try {
      if (session) {
        await updateSession.mutateAsync({ id: session.id, data: values });
      } else {
        await createSession.mutateAsync(values);
      }
      reset();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{session ? "Edit academic session" : "Create academic session"}</DialogTitle>
          <DialogDescription>
            {session ? "Update the session dates." : "e.g. 2024/2025"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="session-name">Session name</Label>
            <Input id="session-name" placeholder="2024/2025" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="session-start">Start date</Label>
              <Input id="session-start" type="date" {...register("start_date")} />
              {errors.start_date && <p className="text-sm text-destructive">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="session-end">End date</Label>
              <Input id="session-end" type="date" {...register("end_date")} />
              {errors.end_date && <p className="text-sm text-destructive">{errors.end_date.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const termSchema = z.object({
  name: z.string().min(1, "Term name is required").max(50),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});
type TermFormValues = z.infer<typeof termSchema>;

function TermFormDialog({
  open,
  onOpenChange,
  sessionId,
  term,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
  term?: Term;
}) {
  const createTerm = useCreateTerm(sessionId);
  const updateTerm = useUpdateTerm(sessionId);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: {
      name: term?.name ?? "",
      start_date: term?.start_date ?? "",
      end_date: term?.end_date ?? "",
    },
  });

  const isPending = createTerm.isPending || updateTerm.isPending;

  async function onSubmit(values: TermFormValues) {
    setFormError(null);
    try {
      if (term) {
        await updateTerm.mutateAsync({ id: term.id, data: values });
      } else {
        await createTerm.mutateAsync(values);
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
          <DialogTitle>{term ? "Edit term" : "Add term"}</DialogTitle>
          <DialogDescription>e.g. First Term</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {formError && (
            <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="term-name">Term name</Label>
            <Input id="term-name" placeholder="First Term" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="term-start">Start date</Label>
              <Input id="term-start" type="date" {...register("start_date")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="term-end">End date</Label>
              <Input id="term-end" type="date" {...register("end_date")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving…" : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TermsPanel({ sessionId }: { sessionId: number }) {
  const termsQuery = useTerms(sessionId);
  const [dialogState, setDialogState] = useState<{ open: boolean; term?: Term }>({ open: false });

  if (termsQuery.isPending) return <LoadingState label="Loading terms…" />;
  if (termsQuery.isError) return <ErrorState error={termsQuery.error} onRetry={() => termsQuery.refetch()} />;

  const terms = termsQuery.data;

  return (
    <div className="space-y-3 bg-muted/20 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Terms</h3>
        <Button size="sm" variant="outline" onClick={() => setDialogState({ open: true })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add term
        </Button>
      </div>

      {terms.length === 0 ? (
        <p className="text-sm text-muted-foreground">No terms yet for this session.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border bg-card">
          {terms.map((term) => (
            <li key={term.id} className="flex items-center justify-between px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                {term.name}
                {term.is_current && <Badge>Current</Badge>}
                <span className="text-muted-foreground">
                  {term.start_date} – {term.end_date}
                </span>
              </span>
              <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, term })}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}

      <TermFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        sessionId={sessionId}
        term={dialogState.term}
      />
    </div>
  );
}

function SessionsList() {
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [dialogState, setDialogState] = useState<{ open: boolean; session?: AcademicSession }>({
    open: false,
  });
  const sessionsQuery = useAcademicSessions(page);
  const activateSession = useActivateAcademicSession();

  if (sessionsQuery.isPending) return <LoadingState label="Loading academic sessions…" />;
  if (sessionsQuery.isError) {
    return <ErrorState error={sessionsQuery.error} onRetry={() => sessionsQuery.refetch()} />;
  }

  const { data: sessions, meta } = sessionsQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {meta.total} academic session{meta.total === 1 ? "" : "s"}
        </p>
        <Button size="sm" onClick={() => setDialogState({ open: true })}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create session
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title="No academic sessions found."
          action={
            <Button size="sm" onClick={() => setDialogState({ open: true })}>
              Create Academic Session
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Session</TableHead>
              <TableHead>Start date</TableHead>
              <TableHead>End date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map((session) => (
              <Fragment key={session.id}>
                <TableRow>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                      aria-label={expandedId === session.id ? "Collapse terms" : "Expand terms"}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {expandedId === session.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="font-medium">{session.name}</TableCell>
                  <TableCell>{session.start_date}</TableCell>
                  <TableCell>{session.end_date}</TableCell>
                  <TableCell>
                    {session.is_current ? (
                      <Badge>Current</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 text-right">
                    {!session.is_current && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={activateSession.isPending}
                        onClick={() => activateSession.mutate(session.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => setDialogState({ open: true, session })}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
                {expandedId === session.id && (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <TermsPanel sessionId={session.id} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      )}

      {sessions.length > 0 && (
        <PaginationControls page={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
      )}

      <SessionFormDialog
        open={dialogState.open}
        onOpenChange={(open) => setDialogState((state) => ({ ...state, open }))}
        session={dialogState.session}
      />
    </div>
  );
}

export default function AcademicSessionsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <div>
        <h1 className="text-lg font-semibold">Academic Sessions</h1>
        <p className="text-sm text-muted-foreground">
          Manage academic sessions and their terms.
        </p>
      </div>
      <AdminOnly>
        <SessionsList />
      </AdminOnly>
    </main>
  );
}

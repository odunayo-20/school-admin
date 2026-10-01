"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAssessments, useCreateScore, useResults, useScores, useUpdateScore } from "@/lib/staff-portal/queries";
import { ApiError } from "@/lib/api/errors";
import type { Score } from "@/lib/staff-portal/types";

const scoreSchema = z.object({
  score: z
    .string()
    .min(1, "Score is required")
    .refine((value) => !Number.isNaN(Number(value)), "Enter a valid number")
    .refine((value) => Number(value) >= 0, "Score cannot be negative"),
  remarks: z.string().max(1000).optional(),
});

type ScoreFormValues = z.infer<typeof scoreSchema>;

/**
 * The "record a score for a new student" picker is built from the roster
 * ResultsPanel's own compile action already discovered (shared TanStack
 * Query cache, same key — no second fetch) — there is no independent class
 * roster endpoint a teacher can call; see the Module 10 report.
 */
export function ScoresPanel({ classSubjectId, termId }: { classSubjectId: number; termId: number }) {
  const assessmentsQuery = useAssessments(classSubjectId, termId);
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const resultsQuery = useResults(classSubjectId, termId);
  const scoresQuery = useScores(assessmentId ?? 0);
  const createScore = useCreateScore(assessmentId ?? 0);
  const updateScore = useUpdateScore(assessmentId ?? 0);
  const [dialogState, setDialogState] = useState<{ enrollmentId: number; studentName: string; existing: Score | null } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const assessment = assessmentsQuery.data?.find((a) => a.id === assessmentId) ?? null;

  const unscoredRoster = useMemo(() => {
    if (!resultsQuery.data || !scoresQuery.data) return [];
    const scoredEnrollmentIds = new Set(scoresQuery.data.map((s) => s.enrollment.id));
    return resultsQuery.data
      .map((r) => r.enrollment)
      .filter((enrollment) => !scoredEnrollmentIds.has(enrollment.id));
  }, [resultsQuery.data, scoresQuery.data]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoreFormValues>({ resolver: zodResolver(scoreSchema) });

  function openForNew(enrollmentId: number, studentName: string) {
    setFormError(null);
    reset({ score: "", remarks: "" });
    setDialogState({ enrollmentId, studentName, existing: null });
  }

  function openForEdit(score: Score) {
    setFormError(null);
    reset({ score: score.score, remarks: score.remarks ?? "" });
    setDialogState({ enrollmentId: score.enrollment.id, studentName: score.enrollment.student.full_name, existing: score });
  }

  async function onSubmit(values: ScoreFormValues) {
    if (!dialogState || !assessmentId) return;
    setFormError(null);
    const score = Number(values.score);
    try {
      if (dialogState.existing) {
        await updateScore.mutateAsync({ id: dialogState.existing.id, payload: { score, remarks: values.remarks || null } });
      } else {
        await createScore.mutateAsync({
          assessment_id: assessmentId,
          enrollment_id: dialogState.enrollmentId,
          score,
          remarks: values.remarks || null,
        });
      }
      setDialogState(null);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation" && error.fieldErrors?.score) {
        setFormError(error.fieldErrors.score[0]);
        return;
      }
      setFormError(error instanceof ApiError ? error.message : "Could not save this score.");
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-medium text-muted-foreground">Scores</h2>
        {assessmentsQuery.isSuccess && assessmentsQuery.data.length > 0 && (
          <Select
            id="assessment-select"
            aria-label="Assessment"
            className="w-56"
            value={assessmentId ?? ""}
            onChange={(e) => setAssessmentId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Choose an assessment…</option>
            {assessmentsQuery.data.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (/{a.max_score})
              </option>
            ))}
          </Select>
        )}
      </div>

      {assessmentsQuery.isPending && <LoadingState label="Loading assessments…" />}
      {assessmentsQuery.isError && <ErrorState error={assessmentsQuery.error} onRetry={() => assessmentsQuery.refetch()} />}
      {assessmentsQuery.isSuccess && assessmentsQuery.data.length === 0 && (
        <EmptyState
          title="No assessments configured for this term."
          description="Assessments are configured by your school's administration."
        />
      )}

      {assessmentId && assessment && (
        <div className="space-y-3">
          {scoresQuery.isPending && <LoadingState label="Loading scores…" />}
          {scoresQuery.isError && <ErrorState error={scoresQuery.error} onRetry={() => scoresQuery.refetch()} />}

          {scoresQuery.isSuccess && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {scoresQuery.data.map((score) => (
                  <TableRow key={score.id}>
                    <TableCell className="font-medium">{score.enrollment.student.full_name}</TableCell>
                    <TableCell>
                      {score.score} / {score.max_score}
                    </TableCell>
                    <TableCell>{score.score_percentage !== null ? `${score.score_percentage}%` : "—"}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openForEdit(score)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {unscoredRoster.map((enrollment) => (
                  <TableRow key={`unscored-${enrollment.id}`}>
                    <TableCell className="font-medium">{enrollment.student.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">Not scored yet</TableCell>
                    <TableCell>—</TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openForNew(enrollment.id, enrollment.student.full_name)}>
                        Record score
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {scoresQuery.isSuccess && scoresQuery.data.length === 0 && unscoredRoster.length === 0 && (
            <EmptyState
              title="No roster available yet."
              description="Compile this class subject's results above first — that is what discovers the class roster."
            />
          )}
        </div>
      )}

      <Dialog open={dialogState !== null} onOpenChange={(open) => !open && setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState?.existing ? "Edit score" : "Record score"}</DialogTitle>
          </DialogHeader>
          {dialogState && assessment && (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {dialogState.studentName} — {assessment.name} (out of {assessment.max_score})
              </p>
              {formError && (
                <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="score-value">Score</Label>
                <Input id="score-value" type="number" step="0.01" min={0} aria-invalid={Boolean(errors.score)} {...register("score")} />
                {errors.score && <p className="text-sm text-destructive">{errors.score.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="score-remarks">Remarks (optional)</Label>
                <Input id="score-remarks" {...register("remarks")} />
              </div>
              <Button type="submit" className="w-full" disabled={createScore.isPending || updateScore.isPending}>
                {createScore.isPending || updateScore.isPending ? "Saving…" : "Save score"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

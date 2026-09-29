"use client";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ResultEntry } from "@/lib/results/types";

export interface EntryDraft {
  ca_score: string;
  exam_score: string;
}

/**
 * Total/grade/remark always reflect the last SAVED state from the API
 * (Laravel is assumed to compute them via Module 02's grading scale) — they
 * intentionally do not update live as CA/Exam are typed. Save draft to see
 * fresh values.
 */
export function ResultEntryTable({
  entries,
  drafts,
  editable,
  onChange,
}: {
  entries: ResultEntry[];
  drafts: Record<number, EntryDraft>;
  editable: boolean;
  onChange: (studentId: number, field: "ca_score" | "exam_score", value: string) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Student no.</TableHead>
          <TableHead>CA</TableHead>
          <TableHead>Exam</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>Grade</TableHead>
          <TableHead>Remark</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry) => {
          const draft = drafts[entry.student.id] ?? { ca_score: "", exam_score: "" };
          return (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.student.name}</TableCell>
              <TableCell className="text-muted-foreground">{entry.student.student_no}</TableCell>
              <TableCell>
                {editable ? (
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className="w-20"
                    value={draft.ca_score}
                    onChange={(e) => onChange(entry.student.id, "ca_score", e.target.value)}
                    aria-label={`${entry.student.name} CA score`}
                  />
                ) : (
                  (entry.ca_score ?? "—")
                )}
              </TableCell>
              <TableCell>
                {editable ? (
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className="w-20"
                    value={draft.exam_score}
                    onChange={(e) => onChange(entry.student.id, "exam_score", e.target.value)}
                    aria-label={`${entry.student.name} exam score`}
                  />
                ) : (
                  (entry.exam_score ?? "—")
                )}
              </TableCell>
              <TableCell>{entry.total_score ?? "—"}</TableCell>
              <TableCell>{entry.grade ? <Badge variant="outline">{entry.grade}</Badge> : "—"}</TableCell>
              <TableCell className="text-muted-foreground">{entry.remark ?? "—"}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

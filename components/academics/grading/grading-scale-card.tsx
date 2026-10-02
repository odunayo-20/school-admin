"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Edit2,
  GraduationCap,
  Layers,
  MoreVertical,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useArchiveGradingScale,
  useGradingScaleDetail,
  useUpdateGradingScale,
} from "@/lib/academics/queries";
import type { GradingScale, GradingScaleItem } from "@/lib/academics/types";
import { cn } from "@/lib/utils";
import { GradingBandSpectrum } from "./grading-band-spectrum";
import { getGradeBadgeStyle } from "./grading-presets";

interface GradingScaleCardProps {
  scale: GradingScale;
  onEdit: (scale: GradingScale) => void;
  onSimulate: (scale: GradingScale) => void;
  onClone: (scale: GradingScale) => void;
}

export function GradingScaleCard({
  scale,
  onEdit,
  onSimulate,
  onClone,
}: GradingScaleCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Load complete scale detail to get items array (omitted on list endpoint per API spec)
  const detailQuery = useGradingScaleDetail(scale.id);
  const fullScale = detailQuery.data ?? scale;
  const items: GradingScaleItem[] = fullScale.items ?? [];

  const archiveMutation = useArchiveGradingScale();
  const updateMutation = useUpdateGradingScale();

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(a.min_percentage) - Number(b.min_percentage));
  }, [items]);

  const maxPoint = useMemo(() => {
    let max = 0;
    items.forEach((it) => {
      const pt = Number(it.grade_point);
      if (!isNaN(pt) && pt > max) max = pt;
    });
    return max;
  }, [items]);

  const isActive = scale.status === "ACTIVE";
  const isArchived = scale.status === "ARCHIVED";
  const isInactive = scale.status === "INACTIVE";

  const handleActivate = async () => {
    if (detailQuery.isPending) return;
    try {
      await updateMutation.mutateAsync({
        id: scale.id,
        data: {
          name: scale.name,
          code: scale.code,
          sort_order: scale.sort_order ?? 0,
          status: "ACTIVE",
          items: items.map((it) => ({
            grade: it.grade,
            min_percentage: Number(it.min_percentage),
            max_percentage: Number(it.max_percentage),
            grade_point:
              it.grade_point !== null && it.grade_point !== undefined
                ? Number(it.grade_point)
                : null,
            remark: it.remark ?? null,
          })),
        },
      });
    } catch {
      // Handled by global query error notifications
    }
  };

  const handleArchive = async () => {
    if (confirm(`Are you sure you want to archive "${scale.name}"? Active assessments will no longer use this scheme.`)) {
      try {
        await archiveMutation.mutateAsync(fullScale);
      } catch {
        // Handled by error notifications
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden",
        isActive
          ? "border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-emerald-500/[0.03]"
          : isArchived
          ? "border-border/60 opacity-85 bg-muted/[0.15]"
          : "border-border/80"
      )}
    >
      {/* Top Header */}
      <div className="p-5 pb-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Class Level Pill */}
              <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <GraduationCap className="h-3 w-3" />
                {scale.class_level?.name || "Class Level"}
              </span>

              {/* Status Badge */}
              {isActive ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Scheme
                </span>
              ) : isArchived ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                  <Archive className="h-3 w-3" />
                  Archived
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Clock className="h-3 w-3" />
                  Inactive
                </span>
              )}

              {/* Code Pill */}
              <span className="font-mono text-[11px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded border border-border/70">
                {scale.code}
              </span>
            </div>

            <h3 className="text-base font-bold tracking-tight text-foreground pt-1">
              {scale.name}
            </h3>
          </div>

          {/* Quick GPA Pill */}
          <div className="text-right shrink-0">
            <span className="text-[10px] text-muted-foreground block uppercase font-medium">
              Ceiling GPA
            </span>
            <span className="font-mono text-sm font-bold text-foreground">
              {detailQuery.isPending ? "..." : maxPoint > 0 ? `${maxPoint.toFixed(1)}` : "5.0"}
            </span>
          </div>
        </div>

        {/* Continuous Band Spectrum Bar */}
        {detailQuery.isPending ? (
          <Skeleton className="h-6 w-full rounded-lg" />
        ) : (
          <GradingBandSpectrum items={items} showLabels={false} />
        )}

        {/* Quick summary & Expand toggle */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-3">
            <span>
              <strong className="text-foreground font-semibold">{items.length}</strong> grade bands
            </span>
            {sortedItems.length > 0 && (
              <>
                <span>•</span>
                <span>
                  {Number(sortedItems[0].min_percentage)}% –{" "}
                  {Number(sortedItems[sortedItems.length - 1].max_percentage)}% coverage
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <span>{expanded ? "Hide Breakdown" : "View Breakdown"}</span>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded Bands Table */}
      {expanded && (
        <div className="border-t border-border/70 bg-muted/20 p-4 pt-3 text-xs space-y-2">
          {detailQuery.isPending ? (
            <div className="space-y-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground italic text-center py-2">
              No bands configured for this scale.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border/70 bg-card shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/60 border-b border-border/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2 px-3">Grade</th>
                    <th className="py-2 px-3">Score Range</th>
                    <th className="py-2 px-3">GPA Point</th>
                    <th className="py-2 px-3 text-right">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {sortedItems.map((item, idx) => {
                    const badgeStyle = getGradeBadgeStyle(item.grade, Number(item.min_percentage));
                    return (
                      <tr key={item.id ?? idx} className="hover:bg-muted/30">
                        <td className="py-2 px-3">
                          <span
                            className={cn(
                              "inline-flex items-center justify-center font-mono font-bold px-2 py-0.5 rounded text-xs border",
                              badgeStyle.badgeBg,
                              badgeStyle.badgeText,
                              badgeStyle.badgeBorder
                            )}
                          >
                            {item.grade}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-muted-foreground">
                          {Number(item.min_percentage)}% – {Number(item.max_percentage)}%
                        </td>
                        <td className="py-2 px-3 font-mono text-foreground font-semibold">
                          {item.grade_point !== null && item.grade_point !== undefined
                            ? Number(item.grade_point).toFixed(2)
                            : "—"}
                        </td>
                        <td className="py-2 px-3 text-right text-muted-foreground font-medium">
                          {item.remark || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Card Actions Footer */}
      <div className="border-t border-border/70 bg-card/60 p-3 px-5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Test / Simulate Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSimulate(fullScale)}
            className="h-8 text-xs gap-1.5"
            title="Test a score against this scale"
          >
            <Calculator className="h-3.5 w-3.5 text-primary" />
            <span>Simulate Score</span>
          </Button>

          {/* Clone / Template Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onClone(fullScale)}
            className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            title="Duplicate bands to another class level"
          >
            <Copy className="h-3.5 w-3.5" />
            <span>Clone</span>
          </Button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Set Active Button if not active */}
          {!isActive && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleActivate}
              disabled={updateMutation.isPending || detailQuery.isPending}
              className="h-8 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
              title="Set this as the active scheme for this class level"
            >
              <Play className="h-3 w-3" />
              <span>Make Active</span>
            </Button>
          )}

          {/* Edit Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onEdit(fullScale)}
            className="h-8 text-xs gap-1.5"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </Button>

          {/* Archive Button if not already archived */}
          {!isArchived && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleArchive}
              disabled={archiveMutation.isPending || detailQuery.isPending}
              className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1"
              title="Archive this scale"
            >
              <Archive className="h-3.5 w-3.5" />
              <span className="sr-only">Archive</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

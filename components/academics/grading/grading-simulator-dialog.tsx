"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  ChevronRight,
  Flame,
  HelpCircle,
  Loader2,
  Percent,
  Sliders,
  Sparkles,
} from "lucide-react";
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
import { useCalculateGrade, useGradingScaleDetail } from "@/lib/academics/queries";
import type { GradingCalculationResult, GradingScale } from "@/lib/academics/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { GradingBandSpectrum } from "./grading-band-spectrum";
import { getGradeBadgeStyle } from "./grading-presets";

interface GradingSimulatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scale: GradingScale | null;
  scales?: GradingScale[];
  onSelectScale?: (scale: GradingScale) => void;
}

export function GradingSimulatorDialog({
  open,
  onOpenChange,
  scale: initialScale,
  scales = [],
  onSelectScale,
}: GradingSimulatorDialogProps) {
  const [selectedScaleId, setSelectedScaleId] = useState<number>(initialScale?.id ?? 0);
  const [percentage, setPercentage] = useState<number>(75);
  const debouncedPercentage = useDebouncedValue(percentage, 250);

  // Sync selected scale when prop changes
  useEffect(() => {
    if (initialScale?.id) {
      setSelectedScaleId(initialScale.id);
    }
  }, [initialScale?.id]);

  // Load scale detail to ensure we have the full items for the spectrum
  const scaleDetailQuery = useGradingScaleDetail(selectedScaleId);
  const activeScale = scaleDetailQuery.data ?? initialScale;

  const calculateMutation = useCalculateGrade();
  const [calcResult, setCalcResult] = useState<GradingCalculationResult | null>(null);

  // Trigger calculation when scale or percentage changes
  useEffect(() => {
    if (open && selectedScaleId > 0 && !isNaN(debouncedPercentage)) {
      calculateMutation.mutate(
        { id: selectedScaleId, percentage: debouncedPercentage },
        {
          onSuccess: (data) => setCalcResult(data),
          onError: () => setCalcResult(null),
        }
      );
    }
  }, [open, selectedScaleId, debouncedPercentage]);

  const quickPresets = [95, 82, 74.5, 63, 52, 44, 32];

  const badgeStyle = calcResult?.grade
    ? getGradeBadgeStyle(calcResult.grade, calcResult.percentage)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Calculator className="h-4 w-4" />
            <span>Score Interpretation Simulator</span>
          </div>
          <DialogTitle className="text-xl">
            Simulate Evaluation for {activeScale?.name ?? "Grading Scale"}
          </DialogTitle>
          <DialogDescription>
            Live backend evaluation test of how percentage scores translate into letter grades, GPA points, and remarks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          {/* Scale Switcher if multiple scales provided */}
          {scales.length > 1 && (
            <div className="space-y-1.5">
              <Label htmlFor="sim-scale-select" className="text-xs">
                Active Scheme Evaluator
              </Label>
              <select
                id="sim-scale-select"
                value={selectedScaleId}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedScaleId(id);
                  const found = scales.find((s) => s.id === id);
                  if (found && onSelectScale) onSelectScale(found);
                }}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {scales.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) — {s.class_level?.name ?? "Class Level"} ({s.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Interactive Spectrum Bar with live indicator pin */}
          {activeScale?.items && activeScale.items.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-card/60 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Sliders className="h-3.5 w-3.5 text-primary" />
                  Band Spectrum Distribution
                </span>
                <span className="text-[11px] text-muted-foreground font-mono">
                  Target Pin: {percentage.toFixed(1)}%
                </span>
              </div>
              <GradingBandSpectrum
                items={activeScale.items}
                highlightPercentage={percentage}
                showLabels={true}
              />
            </div>
          )}

          {/* Percentage Slider & Number Input */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sim-percentage-input" className="text-xs font-semibold">
                Test Score Percentage
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative w-24">
                  <Input
                    id="sim-percentage-input"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={percentage}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setPercentage(Math.max(0, Math.min(100, val)));
                      }
                    }}
                    className="h-8 pr-6 text-right font-mono font-bold text-sm"
                  />
                  <Percent className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              step={0.5}
              value={percentage}
              onChange={(e) => setPercentage(parseFloat(e.target.value))}
              className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-muted-foreground mr-1">Quick tests:</span>
              {quickPresets.map((qp) => (
                <button
                  key={qp}
                  type="button"
                  onClick={() => setPercentage(qp)}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-mono transition-colors border",
                    percentage === qp
                      ? "border-primary bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border-border/70 bg-background hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  {qp}%
                </button>
              ))}
            </div>
          </div>

          {/* Calculation Outcome Display */}
          <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                Backend Evaluator Response
              </span>
              {calculateMutation.isPending && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Calculating...</span>
                </div>
              )}
            </div>

            {calcResult?.grade ? (
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl font-black font-mono shadow-xs",
                      badgeStyle?.badgeBg,
                      badgeStyle?.badgeText,
                      badgeStyle?.badgeBorder
                    )}
                  >
                    {calcResult.grade}
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground">
                      {calcResult.remark || "Standard Evaluation"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>
                        GPA Point:{" "}
                        <strong className="font-mono text-foreground font-bold">
                          {calcResult.grade_point
                            ? Number(calcResult.grade_point).toFixed(2)
                            : "0.00"}
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Percentage:{" "}
                        <strong className="font-mono text-foreground font-bold">
                          {Number(calcResult.percentage).toFixed(2)}%
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                {calcResult.matched_band && (
                  <div className="rounded-lg border border-border/70 bg-muted/40 p-2.5 px-3 text-right sm:self-center">
                    <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                      Matched Band Rule
                    </span>
                    <span className="font-mono text-xs font-semibold text-foreground">
                      {Number(calcResult.matched_band.min_percentage)}% –{" "}
                      {Number(calcResult.matched_band.max_percentage)}%
                    </span>
                  </div>
                )}
              </div>
            ) : calcResult && !calcResult.grade ? (
              <div className="pt-4 flex items-center gap-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="font-semibold">Unassigned Band Gap</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                    The score <strong>{percentage}%</strong> falls into an undefined gap within this scale. Per Module 11 specifications, no grade is guessed and <code className="font-mono bg-muted/50 px-1 rounded">null</code> is returned safely.
                  </p>
                </div>
              </div>
            ) : (
              <div className="pt-4 text-center py-6 text-xs text-muted-foreground">
                Enter a score percentage above to preview interpretation.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close Simulator
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

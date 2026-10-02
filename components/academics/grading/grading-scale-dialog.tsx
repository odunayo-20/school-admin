"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  Copy,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  useCreateGradingScale,
  useGradingScaleDetail,
  useUpdateGradingScale,
} from "@/lib/academics/queries";
import { ApiError } from "@/lib/api/errors";
import type {
  ClassLevel,
  CreateGradingScaleInput,
  GradingScale,
  GradingScaleItemInput,
  UpdateGradingScaleInput,
} from "@/lib/academics/types";
import { cn } from "@/lib/utils";
import { GradingBandSpectrum } from "./grading-band-spectrum";
import {
  GRADING_PRESETS,
  getGradeBadgeStyle,
  validateBandsCoherence,
} from "./grading-presets";

interface GradingScaleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scale?: GradingScale | null;
  classLevels: ClassLevel[];
  existingScales: GradingScale[];
  initialClassLevelId?: number;
  templateBands?: GradingScaleItemInput[];
}

export function GradingScaleDialog({
  open,
  onOpenChange,
  scale,
  classLevels,
  existingScales,
  initialClassLevelId,
  templateBands,
}: GradingScaleDialogProps) {
  const isEditing = Boolean(scale && scale.id);

  // If editing, load scale detail with full items
  const detailQuery = useGradingScaleDetail(scale?.id ?? 0);
  const resolvedScale = detailQuery.data ?? scale;

  const createScaleMutation = useCreateGradingScale();
  const updateScaleMutation = useUpdateGradingScale();

  // Form states
  const [classLevelId, setClassLevelId] = useState<number>(0);
  const [name, setName] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [status, setStatus] = useState<string>("ACTIVE");
  const [items, setItems] = useState<GradingScaleItemInput[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize or reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormError(null);

      if (resolvedScale) {
        // Edit mode
        const lvlId = resolvedScale.class_level_id || resolvedScale.class_level?.id || 0;
        setClassLevelId(lvlId);
        setName(resolvedScale.name || "");
        setCode(resolvedScale.code || "");
        setSortOrder(resolvedScale.sort_order ?? 0);
        setStatus(resolvedScale.status || "ACTIVE");

        if (resolvedScale.items && resolvedScale.items.length > 0) {
          setItems(
            resolvedScale.items.map((it) => ({
              id: it.id,
              grade: it.grade,
              min_percentage: Number(it.min_percentage),
              max_percentage: Number(it.max_percentage),
              grade_point:
                it.grade_point !== null && it.grade_point !== undefined
                  ? Number(it.grade_point)
                  : null,
              remark: it.remark ?? "",
            }))
          );
        } else {
          // Fallback to default WAEC preset if empty
          setItems([...GRADING_PRESETS[0].bands]);
        }
      } else {
        // Create mode
        const initialLvl =
          initialClassLevelId ||
          classLevels.find((lvl) => lvl.status === "ACTIVE")?.id ||
          classLevels[0]?.id ||
          0;
        setClassLevelId(initialLvl);

        const lvlObj = classLevels.find((l) => l.id === initialLvl);
        const lvlName = lvlObj?.name || "Standard";
        const lvlCode = lvlObj?.code ? `${lvlObj.code}-STD` : "STD-SCALE";

        setName(`${lvlName} Standard Grading Scheme`);
        setCode(lvlCode.toUpperCase());
        setSortOrder(0);
        setStatus("ACTIVE");

        if (templateBands && templateBands.length > 0) {
          setItems([...templateBands]);
        } else {
          // Default preset: Standard 5-point
          setItems([...GRADING_PRESETS[1].bands]);
        }
      }
    }
  }, [open, resolvedScale?.id, initialClassLevelId]);

  // Which class levels already have an ACTIVE scale
  const levelsWithActiveScales = useMemo(() => {
    const map = new Map<number, GradingScale>();
    existingScales.forEach((s) => {
      const lvlId = s.class_level_id || s.class_level?.id;
      if (lvlId && s.status === "ACTIVE" && (!scale || s.id !== scale.id)) {
        map.set(lvlId, s);
      }
    });
    return map;
  }, [existingScales, scale]);

  const activeScaleOnSelectedLevel = classLevelId ? levelsWithActiveScales.get(classLevelId) : null;

  // Real-time client coherence validation
  const coherenceIssues = useMemo(() => {
    return validateBandsCoherence(items);
  }, [items]);

  const hasBlockingErrors = coherenceIssues.some((issue) => issue.type === "error");

  // Handle Preset Selection
  const applyPreset = (preset: typeof GRADING_PRESETS[number]) => {
    setItems([...preset.bands]);
    if (!isEditing) {
      const lvlObj = classLevels.find((l) => l.id === classLevelId);
      const prefix = lvlObj?.name ? `${lvlObj.name} ` : "";
      setName(`${prefix}${preset.suggestedName}`);
      if (lvlObj?.code) {
        setCode(`${lvlObj.code}-${preset.suggestedCodeSuffix}`.toUpperCase());
      }
    }
  };

  // Bands Editor Helpers
  const addBand = () => {
    // Guess appropriate boundaries based on existing bands
    const sorted = [...items].sort((a, b) => Number(a.min_percentage) - Number(b.min_percentage));
    let nextMin = 0;
    let nextMax = 100;

    if (sorted.length > 0) {
      const highest = sorted[sorted.length - 1];
      const lowest = sorted[0];
      if (Number(lowest.min_percentage) > 0) {
        nextMin = 0;
        nextMax = Math.max(0, Number(lowest.min_percentage) - 0.01);
      } else {
        nextMin = Number(highest.max_percentage) + 0.01;
        nextMax = 100;
      }
    }

    setItems([
      ...items,
      {
        grade: "NEW",
        min_percentage: parseFloat(nextMin.toFixed(2)),
        max_percentage: parseFloat(nextMax.toFixed(2)),
        grade_point: 1.0,
        remark: "Pass",
      },
    ]);
  };

  const removeBand = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const updateBand = (index: number, field: keyof GradingScaleItemInput, value: unknown) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const sortBandsAscending = () => {
    const sorted = [...items].sort((a, b) => Number(a.min_percentage) - Number(b.min_percentage));
    setItems(sorted);
  };

  // Submit Handler
  const isPending = createScaleMutation.isPending || updateScaleMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Scale name is required.");
      return;
    }
    if (!code.trim()) {
      setFormError("Scale code is required.");
      return;
    }
    if (items.length === 0) {
      setFormError("At least one grade band is required.");
      return;
    }
    if (hasBlockingErrors) {
      const firstErr = coherenceIssues.find((i) => i.type === "error");
      setFormError(firstErr?.message || "Please fix the grade band validation issues before saving.");
      return;
    }

    // Format items cleanly with numbers
    const cleanItems: GradingScaleItemInput[] = items.map((it) => ({
      grade: it.grade.trim().toUpperCase(),
      min_percentage: Number(it.min_percentage),
      max_percentage: Number(it.max_percentage),
      grade_point:
        it.grade_point !== null && it.grade_point !== undefined && String(it.grade_point) !== ""
          ? Number(it.grade_point)
          : null,
      remark: it.remark ? it.remark.trim() : null,
    }));

    try {
      if (isEditing && scale) {
        const payload: UpdateGradingScaleInput = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          sort_order: Number(sortOrder) || 0,
          status,
          items: cleanItems,
        };
        await updateScaleMutation.mutateAsync({ id: scale.id, data: payload });
      } else {
        const payload: CreateGradingScaleInput = {
          class_level_id: Number(classLevelId),
          name: name.trim(),
          code: code.trim().toUpperCase(),
          sort_order: Number(sortOrder) || 0,
          items: cleanItems,
        };
        await createScaleMutation.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(err.message);
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError("Failed to save grading scale. Please verify configuration.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            <span>{isEditing ? "Scale Amendment" : "Scale Provisioning"}</span>
          </div>
          <DialogTitle className="text-xl">
            {isEditing ? `Edit Grading Scheme: ${scale?.name}` : "Configure New Grading Scale"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update score evaluation rules and band boundaries. Class level scope is immutable."
              : "Provision a standardized percentage-to-grade interpretation scheme for a specific class level."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Top Level Error Banner */}
          {formError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{formError}</div>
            </div>
          )}

          {/* Section 1: Scope & Identity */}
          <div className="space-y-4 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              1. Scale Scope & Identity
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Class Level Selector */}
              <div className="space-y-1.5">
                <Label htmlFor="class-level-select" className="text-xs">
                  Target Class Level <span className="text-destructive">*</span>
                </Label>
                {isEditing ? (
                  <div className="flex items-center gap-2 rounded-md border border-input bg-muted/60 px-3 py-2 text-sm text-foreground">
                    <span className="font-medium">
                      {scale?.class_level?.name || "Class Level Scoped"}
                    </span>
                    <Badge variant="outline" className="text-[10px] ml-auto">
                      Immutable
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <select
                      id="class-level-select"
                      value={classLevelId}
                      onChange={(e) => {
                        const newLvlId = Number(e.target.value);
                        setClassLevelId(newLvlId);
                        const lvlObj = classLevels.find((l) => l.id === newLvlId);
                        if (lvlObj) {
                          setName(`${lvlObj.name} Standard Grading Scheme`);
                          if (lvlObj.code) setCode(`${lvlObj.code}-STD`.toUpperCase());
                        }
                      }}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {classLevels.map((lvl) => {
                        const hasActive = levelsWithActiveScales.has(lvl.id);
                        return (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.name} ({lvl.code}) {hasActive ? "• (Active Scale Present)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    {activeScaleOnSelectedLevel && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                        <span>
                          Notice: <strong>{activeScaleOnSelectedLevel.name}</strong> is currently active for this level.
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Status (Edit Mode Only) */}
              {isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="scale-status-select" className="text-xs">
                    Lifecycle Status
                  </Label>
                  <select
                    id="scale-status-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ACTIVE">ACTIVE (Enforce as Active Scheme)</option>
                    <option value="INACTIVE">INACTIVE (Standby Scheme)</option>
                    <option value="ARCHIVED">ARCHIVED (Retired Scheme)</option>
                  </select>
                </div>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="scale-name" className="text-xs">
                  Scheme Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scale-name"
                  placeholder="e.g. Junior Secondary WAEC Standard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* Code */}
              <div className="space-y-1.5">
                <Label htmlFor="scale-code" className="text-xs">
                  Scheme Code <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="scale-code"
                  placeholder="e.g. JSS-STD"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="font-mono text-sm uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Preset Templates Loader */}
          <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/[0.02] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Wand2 className="h-3.5 w-3.5" />
                Quick Preset Templates
              </span>
              <span className="text-[11px] text-muted-foreground">
                Click any template to auto-populate standard grade bands
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {GRADING_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-border/80 bg-background hover:bg-primary/5 hover:border-primary/40 px-2.5 py-1.5 text-xs text-left transition-colors shadow-xs group"
                >
                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {preset.bands.length} bands ({preset.bands[0].grade} to{" "}
                    {preset.bands[preset.bands.length - 1].grade})
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Live Visual Band Spectrum */}
          {items.length > 0 && (
            <div className="space-y-2 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Live Band Spectrum Preview
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {items.length} Bands Defined
                </span>
              </div>
              <GradingBandSpectrum
                items={items.map((it, idx) => ({
                  id: it.id ?? idx,
                  grade: it.grade,
                  min_percentage: it.min_percentage,
                  max_percentage: it.max_percentage,
                  grade_point: it.grade_point,
                  remark: it.remark,
                }))}
              />
            </div>
          )}

          {/* Section 4: Interactive Bands Table */}
          <div className="space-y-3 rounded-xl border border-border/70 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  2. Percentage Bands & Point Thresholds
                </h4>
                <p className="text-[11px] text-muted-foreground">
                  Ranges are inclusive (<code className="font-mono text-[10px]">min &le; score &le; max</code>). Overlaps will be rejected by the server.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={sortBandsAscending}
                  className="h-7 text-xs px-2"
                >
                  <ArrowUpDown className="mr-1 h-3 w-3" />
                  Sort Ascending
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={addBand}
                  className="h-7 text-xs px-2.5 bg-primary"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Band
                </Button>
              </div>
            </div>

            {/* Coherence Warning / Error Callouts */}
            {coherenceIssues.length > 0 && (
              <div className="space-y-1.5">
                {coherenceIssues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-start gap-2 rounded-md p-2 text-xs",
                      issue.type === "error"
                        ? "bg-destructive/10 text-destructive border border-destructive/20 font-medium"
                        : "bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/20"
                    )}
                  >
                    {issue.type === "error" ? (
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{issue.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Bands List Table */}
            <div className="overflow-x-auto rounded-lg border border-border/70">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border/70 text-muted-foreground font-semibold">
                  <tr>
                    <th className="py-2 px-3 text-left w-20">Grade</th>
                    <th className="py-2 px-3 text-left w-28">Min Score (%)</th>
                    <th className="py-2 px-3 text-left w-28">Max Score (%)</th>
                    <th className="py-2 px-3 text-left w-24">GPA Point</th>
                    <th className="py-2 px-3 text-left">Remark / Description</th>
                    <th className="py-2 px-3 text-center w-12">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {items.map((band, idx) => {
                    const badgeStyle = getGradeBadgeStyle(band.grade, Number(band.min_percentage));
                    const isMinGreater = Number(band.min_percentage) > Number(band.max_percentage);

                    return (
                      <tr key={idx} className="hover:bg-muted/20">
                        {/* Grade Label */}
                        <td className="py-1.5 px-3">
                          <Input
                            value={band.grade}
                            onChange={(e) => updateBand(idx, "grade", e.target.value.toUpperCase())}
                            placeholder="e.g. A"
                            className="h-8 font-mono font-bold text-center text-xs uppercase"
                          />
                        </td>

                        {/* Min % */}
                        <td className="py-1.5 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={band.min_percentage}
                            onChange={(e) =>
                              updateBand(idx, "min_percentage", parseFloat(e.target.value) || 0)
                            }
                            className={cn(
                              "h-8 font-mono text-right text-xs",
                              isMinGreater && "border-destructive ring-1 ring-destructive text-destructive"
                            )}
                          />
                        </td>

                        {/* Max % */}
                        <td className="py-1.5 px-3">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            value={band.max_percentage}
                            onChange={(e) =>
                              updateBand(idx, "max_percentage", parseFloat(e.target.value) || 0)
                            }
                            className="h-8 font-mono text-right text-xs"
                          />
                        </td>

                        {/* GPA Point */}
                        <td className="py-1.5 px-3">
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            max="20"
                            value={
                              band.grade_point !== null && band.grade_point !== undefined
                                ? band.grade_point
                                : ""
                            }
                            onChange={(e) =>
                              updateBand(
                                idx,
                                "grade_point",
                                e.target.value === "" ? null : parseFloat(e.target.value)
                              )
                            }
                            placeholder="e.g. 5.0"
                            className="h-8 font-mono text-right text-xs"
                          />
                        </td>

                        {/* Remark */}
                        <td className="py-1.5 px-3">
                          <Input
                            value={band.remark || ""}
                            onChange={(e) => updateBand(idx, "remark", e.target.value)}
                            placeholder="e.g. Distinction, Credit, Pass"
                            className="h-8 text-xs"
                          />
                        </td>

                        {/* Delete Row Button */}
                        <td className="py-1.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeBand(idx)}
                            disabled={items.length <= 1}
                            className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors p-1"
                            title="Remove band"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || hasBlockingErrors}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Saving Scheme..." : isEditing ? "Save Amendments" : "Create Grading Scale"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

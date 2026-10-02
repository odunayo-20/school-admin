"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  Filter,
  GraduationCap,
  Layers,
  Percent,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { AdminOnly } from "@/components/auth/admin-only";
import { EmptyState, ErrorState, LoadingState } from "@/components/data-state";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useClassLevels,
  useGradingScales,
} from "@/lib/academics/queries";
import type {
  ClassLevel,
  GradingScale,
  GradingScaleItemInput,
} from "@/lib/academics/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { cn } from "@/lib/utils";
import { GradingPolicyBanner } from "@/components/academics/grading/grading-policy-banner";
import { GradingScaleCard } from "@/components/academics/grading/grading-scale-card";
import { GradingScaleDialog } from "@/components/academics/grading/grading-scale-dialog";
import { GradingSimulatorDialog } from "@/components/academics/grading/grading-simulator-dialog";
import { GradingStatsKPI } from "@/components/academics/grading/grading-stats-kpi";

function GradingConfigurationContent() {
  // Query parameters
  const [selectedLevelId, setSelectedLevelId] = useState<number | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");
  const debouncedSearch = useDebouncedValue(search, 300);

  // Queries
  const classLevelsQuery = useClassLevels(1);
  const gradingQuery = useGradingScales();

  const classLevels: ClassLevel[] = classLevelsQuery.data?.data ?? [];
  const scales: GradingScale[] = gradingQuery.data ?? [];

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedScaleForEdit, setSelectedScaleForEdit] = useState<GradingScale | null>(null);

  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [selectedScaleForSim, setSelectedScaleForSim] = useState<GradingScale | null>(null);

  const [cloneBands, setCloneBands] = useState<GradingScaleItemInput[] | undefined>(undefined);

  // Class Level to Active Scale Mapping
  const levelActiveScaleMap = useMemo(() => {
    const map = new Map<number, GradingScale>();
    scales.forEach((s) => {
      const lvlId = s.class_level_id || s.class_level?.id;
      if (lvlId && s.status === "ACTIVE") {
        map.set(lvlId, s);
      }
    });
    return map;
  }, [scales]);

  // Filter scales
  const filteredScales = useMemo(() => {
    return scales.filter((scale) => {
      // 1. Class level filter
      const lvlId = scale.class_level_id || scale.class_level?.id;
      if (selectedLevelId !== "ALL" && lvlId !== selectedLevelId) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== "ALL" && scale.status !== statusFilter) {
        return false;
      }

      // 3. Search filter (matches name, code, class level name)
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matchesName = scale.name.toLowerCase().includes(q);
        const matchesCode = scale.code.toLowerCase().includes(q);
        const matchesLevel = scale.class_level?.name.toLowerCase().includes(q) ?? false;
        if (!matchesName && !matchesCode && !matchesLevel) {
          return false;
        }
      }

      return true;
    });
  }, [scales, selectedLevelId, statusFilter, debouncedSearch]);

  const hasActiveFilters =
    selectedLevelId !== "ALL" || statusFilter !== "ALL" || search.trim() !== "";

  const handleResetFilters = () => {
    setSelectedLevelId("ALL");
    setStatusFilter("ALL");
    setSearch("");
  };

  const handleOpenEdit = (scale: GradingScale) => {
    setSelectedScaleForEdit(scale);
    setEditDialogOpen(true);
  };

  const handleOpenSimulate = (scale: GradingScale) => {
    setSelectedScaleForSim(scale);
    setSimulatorOpen(true);
  };

  const handleOpenClone = (scale: GradingScale) => {
    if (scale.items && scale.items.length > 0) {
      setCloneBands(
        scale.items.map((it) => ({
          grade: it.grade,
          min_percentage: Number(it.min_percentage),
          max_percentage: Number(it.max_percentage),
          grade_point:
            it.grade_point !== null && it.grade_point !== undefined
              ? Number(it.grade_point)
              : null,
          remark: it.remark ?? null,
        }))
      );
    } else {
      setCloneBands(undefined);
    }
    setCreateDialogOpen(true);
  };

  const handleCreateNew = (levelId?: number) => {
    setCloneBands(undefined);
    if (levelId) {
      setSelectedLevelId(levelId);
    }
    setCreateDialogOpen(true);
  };

  const handleRefresh = () => {
    gradingQuery.refetch();
    classLevelsQuery.refetch();
  };

  return (
    <div className="space-y-7">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Link
              href="/academics"
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Academic Framework
            </Link>
            <span>/</span>
            <span className="text-foreground">Grading Policies</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Grading Scales & Evaluation Schemes
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure instructional percentage boundaries, GPA point weights, and automated evaluation rules per class level.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Live Simulator button */}
          {scales.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedScaleForSim(scales.find((s) => s.status === "ACTIVE") ?? scales[0]);
                setSimulatorOpen(true);
              }}
              className="h-9 gap-1.5"
            >
              <Calculator className="h-4 w-4 text-primary" />
              <span>Score Simulator</span>
            </Button>
          )}

          {/* Sync / Refresh */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 px-2.5"
            title="Refresh grading datasets"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                (gradingQuery.isFetching || classLevelsQuery.isFetching) && "animate-spin"
              )}
            />
          </Button>

          {/* Create Grading Scale */}
          <Button
            type="button"
            size="sm"
            onClick={() => handleCreateNew()}
            className="h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Create Scale</span>
          </Button>
        </div>
      </div>

      {/* 2. Executive KPI Summary Cards */}
      <GradingStatsKPI
        scales={scales}
        classLevels={classLevels}
        isLoading={gradingQuery.isPending || classLevelsQuery.isPending}
      />

      {/* 3. Academic Policy Banner */}
      <GradingPolicyBanner />

      {/* 4. Filter Toolbar & Class Level Navigator */}
      <div className="space-y-3">
        {/* Class Level Selector Tabs */}
        {classLevels.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {/* All Levels Tab */}
            <button
              type="button"
              onClick={() => setSelectedLevelId("ALL")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-colors border",
                selectedLevelId === "ALL"
                  ? "bg-primary text-primary-foreground border-primary shadow-xs"
                  : "bg-card text-muted-foreground hover:bg-muted border-border/80 hover:text-foreground"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>All Levels</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px]",
                  selectedLevelId === "ALL"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {scales.length}
              </span>
            </button>

            {/* Individual Class Level Tabs */}
            {classLevels.map((lvl) => {
              const activeScale = levelActiveScaleMap.get(lvl.id);
              const scalesForLevel = scales.filter(
                (s) => s.class_level_id === lvl.id || s.class_level?.id === lvl.id
              );
              const isSelected = selectedLevelId === lvl.id;

              return (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSelectedLevelId(lvl.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium whitespace-nowrap transition-colors border",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                      : "bg-card text-muted-foreground hover:bg-muted border-border/80 hover:text-foreground"
                  )}
                >
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>{lvl.name}</span>

                  {/* Active scheme indicator dot */}
                  {activeScale ? (
                    <span
                      className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20"
                      title={`Active scheme configured: ${activeScale.name}`}
                    />
                  ) : (
                    <span
                      className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500/20"
                      title="No active scheme configured for this level"
                    />
                  )}

                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px]",
                      isSelected
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {scalesForLevel.length}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Search & Status Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by scale name, code (e.g. JSS-STD), or level..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Status:</span>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Schemes Only</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-9 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Grading Scales Grid */}
      {gradingQuery.isPending ? (
        <LoadingState label="Loading academic grading schemes..." />
      ) : gradingQuery.isError ? (
        <ErrorState
          error={gradingQuery.error}
          onRetry={() => gradingQuery.refetch()}
        />
      ) : filteredScales.length === 0 ? (
        hasActiveFilters ? (
          <EmptyState
            title="No grading scales match your criteria"
            description="Try changing the search keywords, status filter, or class level selector."
            action={
              <Button size="sm" variant="outline" onClick={handleResetFilters}>
                Clear Filter Constraints
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No grading configuration defined yet"
            description="Define evaluation schemes and score percentage bands (e.g. WAEC, 5.0 GPA) scoped to each class level."
            action={
              <Button size="sm" onClick={() => handleCreateNew()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Create First Grading Scale
              </Button>
            }
          />
        )
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredScales.map((scale) => (
            <GradingScaleCard
              key={scale.id}
              scale={scale}
              onEdit={handleOpenEdit}
              onSimulate={handleOpenSimulate}
              onClone={handleOpenClone}
            />
          ))}
        </div>
      )}

      {/* 6. Dialog Modals */}
      {/* Create Dialog */}
      <GradingScaleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        scale={null}
        classLevels={classLevels}
        existingScales={scales}
        initialClassLevelId={selectedLevelId !== "ALL" ? selectedLevelId : undefined}
        templateBands={cloneBands}
      />

      {/* Edit Dialog */}
      <GradingScaleDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        scale={selectedScaleForEdit}
        classLevels={classLevels}
        existingScales={scales}
      />

      {/* Simulator Dialog */}
      <GradingSimulatorDialog
        open={simulatorOpen}
        onOpenChange={setSimulatorOpen}
        scale={selectedScaleForSim}
        scales={scales}
        onSelectScale={(s) => setSelectedScaleForSim(s)}
      />
    </div>
  );
}

export default function GradingSettingsPage() {
  return (
    <main className="flex-1 space-y-6 px-6 py-8">
      <AdminOnly>
        <GradingConfigurationContent />
      </AdminOnly>
    </main>
  );
}

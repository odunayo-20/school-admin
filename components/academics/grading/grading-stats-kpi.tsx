"use client";

import { useMemo } from "react";
import { Award, CheckCircle2, Layers, Percent, ShieldAlert } from "lucide-react";
import type { ClassLevel, GradingScale } from "@/lib/academics/types";
import { cn } from "@/lib/utils";

interface GradingStatsKPIProps {
  scales: GradingScale[];
  classLevels: ClassLevel[];
  isLoading?: boolean;
}

export function GradingStatsKPI({ scales, classLevels, isLoading }: GradingStatsKPIProps) {
  const stats = useMemo(() => {
    const totalScales = scales.length;
    const activeScales = scales.filter((s) => s.status === "ACTIVE");
    const archivedScales = scales.filter((s) => s.status === "ARCHIVED" || s.status === "INACTIVE");

    // Count how many class levels have an active scale
    const levelsWithActiveScale = new Set<number>();
    activeScales.forEach((s) => {
      if (s.class_level_id) {
        levelsWithActiveScale.add(s.class_level_id);
      } else if (s.class_level?.id) {
        levelsWithActiveScale.add(s.class_level.id);
      }
    });

    const activeLevelsCount = classLevels.filter((lvl) => lvl.status === "ACTIVE" || !lvl.status).length;
    const coveredLevelsCount = levelsWithActiveScale.size;
    const uncoveredCount = Math.max(0, activeLevelsCount - coveredLevelsCount);

    // Compute max GPA across all scale items
    let maxGpa = 0;
    scales.forEach((s) => {
      (s.items ?? []).forEach((item) => {
        const pt = Number(item.grade_point);
        if (!isNaN(pt) && pt > maxGpa) maxGpa = pt;
      });
    });

    return {
      totalScales,
      activeCount: activeScales.length,
      archivedCount: archivedScales.length,
      activeLevelsCount,
      coveredLevelsCount,
      uncoveredCount,
      coveragePercent: activeLevelsCount > 0 ? Math.round((coveredLevelsCount / activeLevelsCount) * 100) : 100,
      maxGpa: maxGpa > 0 ? maxGpa.toFixed(1) : "5.0",
    };
  }, [scales, classLevels]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl border border-border/70 bg-card p-4 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Configured Scales */}
      <div className="rounded-xl border border-border/70 bg-card p-4.5 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Configured Scales</span>
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Layers className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.totalScales}
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stats.activeCount} active • {stats.archivedCount} archived
        </p>
      </div>

      {/* 2. Class Level Coverage */}
      <div className="rounded-xl border border-border/70 bg-card p-4.5 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Level Coverage</span>
          <div className={cn(
            "rounded-lg p-2",
            stats.uncoveredCount === 0
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}>
            {stats.uncoveredCount === 0 ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-foreground">
            {stats.coveredLevelsCount}/{stats.activeLevelsCount}
          </span>
          <span className={cn(
            "text-xs font-semibold px-1.5 py-0.5 rounded-full",
            stats.coveragePercent === 100
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
          )}>
            {stats.coveragePercent}%
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {stats.uncoveredCount === 0
            ? "All active class levels covered"
            : `${stats.uncoveredCount} class level(s) need a scale`}
        </p>
      </div>

      {/* 3. Active Schemes Status */}
      <div className="rounded-xl border border-border/70 bg-card p-4.5 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Active Schemes</span>
          <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
            <Percent className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {stats.activeCount}
        </div>
        <p className="text-[11px] text-muted-foreground">
          1 scheme per class level enforced
        </p>
      </div>

      {/* 4. Grade Point Scale Ceiling */}
      <div className="rounded-xl border border-border/70 bg-card p-4.5 shadow-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">GPA Point Ceiling</span>
          <div className="rounded-lg bg-indigo-500/10 p-2 text-indigo-600 dark:text-indigo-400">
            <Award className="h-4 w-4" />
          </div>
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground font-mono">
          {stats.maxGpa}
        </div>
        <p className="text-[11px] text-muted-foreground">
          Highest grade point benchmark
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown, ChevronUp, Info, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function GradingPolicyBanner() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.05] transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Academic Grading Policy & Boundary Architecture
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                Module 11 Standard
              </span>
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reusable evaluation schemes scoped strictly to instructional class levels with atomic percentage interpretation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1.5 self-end sm:self-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <span>{expanded ? "Hide Architecture Principles" : "View System Guidelines"}</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-primary/15 bg-background/50 p-4 pt-3 text-xs text-muted-foreground space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1 rounded-lg border border-border/60 bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                  1
                </span>
                Class-Level Scope
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Each grading scale applies to exactly one Class Level (e.g. Primary, Junior Secondary). Scope is fixed at creation and cannot be changed.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border/60 bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                  2
                </span>
                Single Active Scheme
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                At most one <span className="font-semibold text-emerald-600 dark:text-emerald-400">ACTIVE</span> scale is permitted per Class Level. To switch schemes, set the new one to active or archive the old one.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border/60 bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                  3
                </span>
                Inclusive Boundaries
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Every band is inclusive (<code className="font-mono text-[10px] bg-muted px-1 rounded">min &le; score &le; max</code>). Overlaps are strictly rejected; adjacent bands must not double-cover boundary points.
              </p>
            </div>

            <div className="space-y-1 rounded-lg border border-border/60 bg-card p-3 shadow-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px]">
                  4
                </span>
                Audit Immutability
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Scales are never hard-deleted because published academic transcripts reference them. Retiring a scheme is performed by setting status to <span className="font-medium">ARCHIVED</span>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md bg-amber-500/10 p-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            <Info className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <strong>Note on score calculations:</strong> Percentage interpretation is side-effect-free. It never mutates scores or results. If a student percentage falls in an unassigned gap, the system returns <code className="font-mono font-semibold">null</code> safely.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

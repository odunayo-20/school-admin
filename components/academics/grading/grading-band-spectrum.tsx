"use client";

import { useMemo, useState } from "react";
import type { GradingScaleItem } from "@/lib/academics/types";
import { getGradeBadgeStyle } from "./grading-presets";
import { cn } from "@/lib/utils";

interface GradingBandSpectrumProps {
  items: GradingScaleItem[];
  highlightPercentage?: number | null;
  className?: string;
  showLabels?: boolean;
}

export function GradingBandSpectrum({
  items,
  highlightPercentage,
  className,
  showLabels = true,
}: GradingBandSpectrumProps) {
  const [hoveredBand, setHoveredBand] = useState<GradingScaleItem | null>(null);

  // Sort bands ascending by min_percentage
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(a.min_percentage) - Number(b.min_percentage));
  }, [items]);

  if (!sortedItems || sortedItems.length === 0) {
    return (
      <div className={cn("h-4 w-full rounded-full bg-muted/60 border border-dashed border-border/80 flex items-center justify-center text-[10px] text-muted-foreground", className)}>
        No bands configured
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* The continuous spectrum track */}
      <div className="relative h-6 w-full overflow-hidden rounded-lg bg-muted/50 border border-border/70 flex shadow-inner">
        {sortedItems.map((item, idx) => {
          const min = Number(item.min_percentage);
          const max = Number(item.max_percentage);
          const widthPercent = Math.max(1, Math.min(100, max - min));
          const style = getGradeBadgeStyle(item.grade, min);
          const isHovered = hoveredBand?.grade === item.grade;
          const isHighlighted =
            highlightPercentage !== undefined &&
            highlightPercentage !== null &&
            highlightPercentage >= min &&
            highlightPercentage <= max;

          return (
            <div
              key={item.id ?? `${item.grade}-${idx}`}
              style={{
                width: `${widthPercent}%`,
                backgroundColor: style.spectrumHex,
              }}
              onMouseEnter={() => setHoveredBand(item)}
              onMouseLeave={() => setHoveredBand(null)}
              className={cn(
                "relative h-full transition-all cursor-pointer flex items-center justify-center border-r border-background/20 last:border-r-0 select-none group",
                isHighlighted && "ring-2 ring-foreground z-10 brightness-110",
                isHovered && "brightness-110 scale-[1.02] z-10"
              )}
              title={`${item.grade}: ${min}% – ${max}% (${item.remark || "GPA: " + Number(item.grade_point).toFixed(1)})`}
            >
              {/* Grade label on segment if wide enough */}
              {widthPercent >= 8 && (
                <span className="text-[11px] font-bold text-white drop-shadow-sm truncate px-1">
                  {item.grade}
                </span>
              )}
            </div>
          );
        })}

        {/* Live indicator pin if highlight percentage is specified */}
        {highlightPercentage !== undefined && highlightPercentage !== null && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-foreground z-20 pointer-events-none shadow-md"
            style={{ left: `${Math.min(100, Math.max(0, highlightPercentage))}%` }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-foreground" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-foreground" />
          </div>
        )}
      </div>

      {/* Axis markers & hover info */}
      {showLabels && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground px-0.5">
          <span>0%</span>
          {hoveredBand ? (
            <span className="font-medium text-foreground">
              Grade <strong className="font-bold">{hoveredBand.grade}</strong>:{" "}
              {Number(hoveredBand.min_percentage)}% – {Number(hoveredBand.max_percentage)}%
              {hoveredBand.remark && ` • ${hoveredBand.remark}`}
              {hoveredBand.grade_point !== null && hoveredBand.grade_point !== undefined && (
                <> (GPA: {Number(hoveredBand.grade_point).toFixed(1)})</>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground/80 italic">Hover band to inspect range</span>
          )}
          <span>100%</span>
        </div>
      )}
    </div>
  );
}

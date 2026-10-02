import type { GradingScaleItemInput } from "@/lib/academics/types";

export interface GradingPreset {
  id: string;
  name: string;
  description: string;
  suggestedName: string;
  suggestedCodeSuffix: string;
  bands: GradingScaleItemInput[];
}

export const GRADING_PRESETS: GradingPreset[] = [
  {
    id: "waec_standard",
    name: "WAEC / WASSCE Standard (9-Point)",
    description: "Standard West African Senior School Certificate grading scheme (A1 to F9).",
    suggestedName: "WASSCE Standard 9-Point Scheme",
    suggestedCodeSuffix: "WAEC-9",
    bands: [
      { grade: "A1", min_percentage: 75, max_percentage: 100, grade_point: 9.0, remark: "Excellent" },
      { grade: "B2", min_percentage: 70, max_percentage: 74.99, grade_point: 8.0, remark: "Very Good" },
      { grade: "B3", min_percentage: 65, max_percentage: 69.99, grade_point: 7.0, remark: "Good" },
      { grade: "C4", min_percentage: 60, max_percentage: 64.99, grade_point: 6.0, remark: "Credit" },
      { grade: "C5", min_percentage: 55, max_percentage: 59.99, grade_point: 5.0, remark: "Credit" },
      { grade: "C6", min_percentage: 50, max_percentage: 54.99, grade_point: 4.0, remark: "Credit" },
      { grade: "D7", min_percentage: 45, max_percentage: 49.99, grade_point: 3.0, remark: "Pass" },
      { grade: "E8", min_percentage: 40, max_percentage: 44.99, grade_point: 2.0, remark: "Pass" },
      { grade: "F9", min_percentage: 0, max_percentage: 39.99, grade_point: 0.0, remark: "Fail" },
    ],
  },
  {
    id: "standard_5point",
    name: "Standard 5-Point Letter Scheme (A–F)",
    description: "Classic 5.0 GPA scale widely utilized across secondary schools and colleges.",
    suggestedName: "Standard Secondary 5.0 Scale",
    suggestedCodeSuffix: "STD-5PT",
    bands: [
      { grade: "A", min_percentage: 70, max_percentage: 100, grade_point: 5.0, remark: "Excellent" },
      { grade: "B", min_percentage: 60, max_percentage: 69.99, grade_point: 4.0, remark: "Very Good" },
      { grade: "C", min_percentage: 50, max_percentage: 59.99, grade_point: 3.0, remark: "Credit" },
      { grade: "D", min_percentage: 45, max_percentage: 49.99, grade_point: 2.0, remark: "Pass" },
      { grade: "E", min_percentage: 40, max_percentage: 44.99, grade_point: 1.0, remark: "Fair Pass" },
      { grade: "F", min_percentage: 0, max_percentage: 39.99, grade_point: 0.0, remark: "Fail" },
    ],
  },
  {
    id: "gpa_4point",
    name: "International 4.0 GPA Scheme",
    description: "North American / International standard 4.0 GPA scale.",
    suggestedName: "International 4.0 GPA Scheme",
    suggestedCodeSuffix: "INT-4PT",
    bands: [
      { grade: "A+", min_percentage: 97, max_percentage: 100, grade_point: 4.0, remark: "High Distinction" },
      { grade: "A", min_percentage: 93, max_percentage: 96.99, grade_point: 4.0, remark: "Distinction" },
      { grade: "A-", min_percentage: 90, max_percentage: 92.99, grade_point: 3.7, remark: "Excellent" },
      { grade: "B+", min_percentage: 87, max_percentage: 89.99, grade_point: 3.3, remark: "Very Good" },
      { grade: "B", min_percentage: 83, max_percentage: 86.99, grade_point: 3.0, remark: "Good" },
      { grade: "B-", min_percentage: 80, max_percentage: 82.99, grade_point: 2.7, remark: "Above Average" },
      { grade: "C+", min_percentage: 77, max_percentage: 79.99, grade_point: 2.3, remark: "Average" },
      { grade: "C", min_percentage: 70, max_percentage: 76.99, grade_point: 2.0, remark: "Satisfactory" },
      { grade: "D", min_percentage: 60, max_percentage: 69.99, grade_point: 1.0, remark: "Marginal Pass" },
      { grade: "F", min_percentage: 0, max_percentage: 59.99, grade_point: 0.0, remark: "Fail" },
    ],
  },
  {
    id: "primary_3tier",
    name: "Primary / Early Years 3-Tier Developmental",
    description: "Standards-based developmental mastery scheme for Nursery and Lower Primary.",
    suggestedName: "Primary Developmental 3-Tier",
    suggestedCodeSuffix: "PRI-DEV",
    bands: [
      { grade: "EX", min_percentage: 80, max_percentage: 100, grade_point: 3.0, remark: "Exceeding Expectations" },
      { grade: "MT", min_percentage: 50, max_percentage: 79.99, grade_point: 2.0, remark: "Meeting Expectations" },
      { grade: "EM", min_percentage: 0, max_percentage: 49.99, grade_point: 1.0, remark: "Emerging Development" },
    ],
  },
  {
    id: "cambridge_igcse",
    name: "Cambridge IGCSE Standard (A*–G)",
    description: "British curriculum standard IGCSE grading bands.",
    suggestedName: "Cambridge IGCSE Scale",
    suggestedCodeSuffix: "IGCSE",
    bands: [
      { grade: "A*", min_percentage: 90, max_percentage: 100, grade_point: 8.0, remark: "Outstanding" },
      { grade: "A", min_percentage: 80, max_percentage: 89.99, grade_point: 7.0, remark: "Excellent" },
      { grade: "B", min_percentage: 70, max_percentage: 79.99, grade_point: 6.0, remark: "Very Good" },
      { grade: "C", min_percentage: 60, max_percentage: 69.99, grade_point: 5.0, remark: "Good / Credit" },
      { grade: "D", min_percentage: 50, max_percentage: 59.99, grade_point: 4.0, remark: "Satisfactory" },
      { grade: "E", min_percentage: 40, max_percentage: 49.99, grade_point: 3.0, remark: "Sufficient" },
      { grade: "F", min_percentage: 30, max_percentage: 39.99, grade_point: 2.0, remark: "Low Pass" },
      { grade: "G", min_percentage: 20, max_percentage: 29.99, grade_point: 1.0, remark: "Minimum Pass" },
      { grade: "U", min_percentage: 0, max_percentage: 19.99, grade_point: 0.0, remark: "Ungraded" },
    ],
  },
];

export interface BandCoherenceIssue {
  type: "error" | "warning" | "info";
  message: string;
}

export function validateBandsCoherence(bands: GradingScaleItemInput[]): BandCoherenceIssue[] {
  const issues: BandCoherenceIssue[] = [];

  if (bands.length === 0) {
    issues.push({ type: "error", message: "At least one grade band is required." });
    return issues;
  }

  // 1. Check individual ranges
  for (let i = 0; i < bands.length; i++) {
    const b = bands[i];
    const min = Number(b.min_percentage);
    const max = Number(b.max_percentage);

    if (isNaN(min) || isNaN(max)) {
      issues.push({ type: "error", message: `Band ${b.grade || i + 1} has invalid numeric boundaries.` });
      continue;
    }

    if (min < 0 || max > 100) {
      issues.push({ type: "error", message: `Band ${b.grade || i + 1} percentage must be between 0 and 100.` });
    }

    if (min > max) {
      issues.push({
        type: "error",
        message: `Band "${b.grade || i + 1}": min percentage (${min}%) cannot exceed max (${max}%).`,
      });
    }
  }

  // 2. Check duplicate grades
  const gradeSeen = new Map<string, number>();
  for (const b of bands) {
    const key = (b.grade || "").trim().toUpperCase();
    if (!key) {
      issues.push({ type: "error", message: "Every band must have a grade label (e.g. A, B, C)." });
      continue;
    }
    const count = gradeSeen.get(key) ?? 0;
    gradeSeen.set(key, count + 1);
  }
  for (const [grade, count] of gradeSeen.entries()) {
    if (count > 1) {
      issues.push({
        type: "error",
        message: `Duplicate grade label "${grade}" used in ${count} bands. Each grade in a scale must be unique.`,
      });
    }
  }

  // 3. Check overlaps (inclusive on both ends)
  const validBands = bands.filter((b) => {
    const min = Number(b.min_percentage);
    const max = Number(b.max_percentage);
    return !isNaN(min) && !isNaN(max) && min <= max;
  });

  for (let i = 0; i < validBands.length; i++) {
    for (let j = i + 1; j < validBands.length; j++) {
      const b1 = validBands[i];
      const b2 = validBands[j];
      const min1 = Number(b1.min_percentage);
      const max1 = Number(b1.max_percentage);
      const min2 = Number(b2.min_percentage);
      const max2 = Number(b2.max_percentage);

      // Overlap condition for inclusive boundaries [min1, max1] and [min2, max2]
      const overlaps = !(max1 < min2 || max2 < min1);
      if (overlaps) {
        issues.push({
          type: "error",
          message: `Overlap detected between "${b1.grade}" (${min1}%–${max1}%) and "${b2.grade}" (${min2}%–${max2}%). Boundaries must not overlap (e.g. use 69.99 and 70.00).`,
        });
      }
    }
  }

  // 4. Gap detection (informational / warning, because API allows gaps but admins should know)
  if (issues.every((i) => i.type !== "error") && validBands.length > 0) {
    const sorted = [...validBands].sort(
      (a, b) => Number(a.min_percentage) - Number(b.min_percentage)
    );

    const lowestMin = Number(sorted[0].min_percentage);
    const highestMax = Number(sorted[sorted.length - 1].max_percentage);

    if (lowestMin > 0) {
      issues.push({
        type: "warning",
        message: `Scale begins at ${lowestMin}%. Scores below this (0.00% – ${(lowestMin - 0.01).toFixed(2)}%) will receive no grade.`,
      });
    }
    if (highestMax < 100) {
      issues.push({
        type: "warning",
        message: `Scale ends at ${highestMax}%. Scores above this will receive no grade.`,
      });
    }

    for (let k = 0; k < sorted.length - 1; k++) {
      const currMax = Number(sorted[k].max_percentage);
      const nextMin = Number(sorted[k + 1].min_percentage);

      // Small gap expected for floating precision e.g. 69.99 to 70.00 is <= 0.02
      const gap = nextMin - currMax;
      if (gap > 0.05) {
        issues.push({
          type: "warning",
          message: `Gap detected between "${sorted[k].grade}" (${currMax}%) and "${sorted[k + 1].grade}" (${nextMin}%).`,
        });
      }
    }
  }

  return issues;
}

/**
 * Returns a semantic color scheme for a given grade string or percentage
 */
export function getGradeBadgeStyle(gradeStr: string, minPercentage = 0): {
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  spectrumHex: string;
} {
  const g = (gradeStr || "").toUpperCase().trim();

  // Tier 1: Distinction / Top grades
  if (
    g.startsWith("A") ||
    g === "EX" ||
    g.includes("DIST") ||
    minPercentage >= 70
  ) {
    return {
      badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
      badgeText: "text-emerald-700 dark:text-emerald-300",
      badgeBorder: "border-emerald-500/30",
      spectrumHex: "#10b981",
    };
  }

  // Tier 2: Very Good / Merit
  if (g.startsWith("B") || g === "MT" || minPercentage >= 60) {
    return {
      badgeBg: "bg-blue-500/10 dark:bg-blue-500/20",
      badgeText: "text-blue-700 dark:text-blue-300",
      badgeBorder: "border-blue-500/30",
      spectrumHex: "#3b82f6",
    };
  }

  // Tier 3: Credit / Average
  if (g.startsWith("C") || minPercentage >= 50) {
    return {
      badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
      badgeText: "text-indigo-700 dark:text-indigo-300",
      badgeBorder: "border-indigo-500/30",
      spectrumHex: "#6366f1",
    };
  }

  // Tier 4: Pass
  if (g.startsWith("D") || minPercentage >= 45) {
    return {
      badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
      badgeText: "text-amber-700 dark:text-amber-300",
      badgeBorder: "border-amber-500/30",
      spectrumHex: "#f59e0b",
    };
  }

  // Tier 5: Low Pass / Marginal
  if (g.startsWith("E") || minPercentage >= 40) {
    return {
      badgeBg: "bg-orange-500/10 dark:bg-orange-500/20",
      badgeText: "text-orange-700 dark:text-orange-300",
      badgeBorder: "border-orange-500/30",
      spectrumHex: "#f97316",
    };
  }

  // Tier 6: Fail / Ungraded
  return {
    badgeBg: "bg-rose-500/10 dark:bg-rose-500/20",
    badgeText: "text-rose-700 dark:text-rose-300",
    badgeBorder: "border-rose-500/30",
    spectrumHex: "#f43f5e",
  };
}

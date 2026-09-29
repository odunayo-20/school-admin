"use client";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useClassDetail } from "@/lib/academics/queries";
import type { SchoolClass } from "@/lib/academics/types";
import type { PromotionDecision } from "@/lib/promotions/types";

export interface DecisionFieldsValue {
  decision: PromotionDecision;
  to_class_id: number | null;
  to_section_id: number | null;
}

const DECISION_LABELS: Record<PromotionDecision, string> = {
  promote: "Promote",
  repeat: "Repeat class",
  graduate: "Graduate",
};

/**
 * Shared decision + target-class/section controls, used both in the bulk
 * promotion review table and the individual promote dialog on a student's
 * profile — deliberately one implementation, not two.
 */
export function DecisionFields({
  idPrefix,
  fromClassId,
  fromClassName,
  classes,
  value,
  onChange,
}: {
  idPrefix: string;
  fromClassId: number;
  fromClassName: string;
  classes: SchoolClass[];
  value: DecisionFieldsValue;
  onChange: (next: DecisionFieldsValue) => void;
}) {
  const targetClassId = value.decision === "repeat" ? fromClassId : value.to_class_id;
  const classDetailQuery = useClassDetail(targetClassId ?? 0);
  const sections = classDetailQuery.data?.sections ?? [];

  function handleDecisionChange(decision: PromotionDecision) {
    if (decision === "repeat") {
      onChange({ decision, to_class_id: fromClassId, to_section_id: null });
    } else if (decision === "graduate") {
      onChange({ decision, to_class_id: null, to_section_id: null });
    } else {
      // "repeat"'s to_class_id is a same-class placeholder, not a real
      // target — never carry it into "promote" as if it were chosen.
      const carryOver = value.decision === "promote" ? value.to_class_id : null;
      onChange({ decision, to_class_id: carryOver, to_section_id: null });
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="space-y-1">
        <Label htmlFor={`${idPrefix}-decision`} className="text-xs text-muted-foreground">
          Decision
        </Label>
        <Select
          id={`${idPrefix}-decision`}
          className="w-36"
          value={value.decision}
          onChange={(e) => handleDecisionChange(e.target.value as PromotionDecision)}
        >
          {(Object.keys(DECISION_LABELS) as PromotionDecision[]).map((decision) => (
            <option key={decision} value={decision}>
              {DECISION_LABELS[decision]}
            </option>
          ))}
        </Select>
      </div>

      {value.decision === "promote" && (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-class`} className="text-xs text-muted-foreground">
            To class
          </Label>
          <Select
            id={`${idPrefix}-class`}
            className="w-36"
            value={value.to_class_id ?? ""}
            onChange={(e) =>
              onChange({ ...value, to_class_id: e.target.value ? Number(e.target.value) : null, to_section_id: null })
            }
          >
            <option value="">Select a class…</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {value.decision === "repeat" && (
        <p className="self-end pb-2 text-sm text-muted-foreground">Stays in {fromClassName}</p>
      )}

      {value.decision !== "graduate" && targetClassId && sections.length > 0 && (
        <div className="space-y-1">
          <Label htmlFor={`${idPrefix}-section`} className="text-xs text-muted-foreground">
            To section
          </Label>
          <Select
            id={`${idPrefix}-section`}
            className="w-32"
            value={value.to_section_id ?? ""}
            onChange={(e) => onChange({ ...value, to_section_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Unassigned</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      {value.decision === "graduate" && (
        <p className="self-end pb-2 text-sm text-muted-foreground">No new enrollment will be created.</p>
      )}
    </div>
  );
}

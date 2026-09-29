import { Badge } from "@/components/ui/badge";
import type { EligibilityStatus } from "@/lib/promotions/types";

export function EligibilityBadge({ eligibility }: { eligibility: EligibilityStatus }) {
  if (eligibility === "eligible") return <Badge>Eligible</Badge>;
  if (eligibility === "not_eligible") return <Badge variant="outline">Not eligible</Badge>;
  return <Badge variant="outline">Unknown</Badge>;
}

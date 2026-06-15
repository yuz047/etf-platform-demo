import { Badge } from "@/components/ui/badge";
import { formatOwner } from "@/lib/formatting";
import type { RuleBreach } from "@/lib/types";

export function RuleBreachTimeline({ breaches }: { breaches: RuleBreach[] }) {
  return (
    <div className="space-y-2">
      {breaches.map((breach) => (
        <div className="border-l-2 border-zinc-300 pl-3 text-xs" key={breach.id}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-zinc-950">{breach.rule_id}</span>
            <Badge status={breach.severity}>{formatOwner(breach.owner)}</Badge>
          </div>
          <div className="mt-1 text-zinc-600">
            {breach.metric}: {breach.metric_value} vs {breach.threshold}
          </div>
          <div className="mt-1 text-zinc-500">{breach.evidence_ids.join(", ")}</div>
        </div>
      ))}
    </div>
  );
}

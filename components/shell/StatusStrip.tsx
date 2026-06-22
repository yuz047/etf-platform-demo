import { Badge } from "@/components/ui/badge";
import { shortDateTime } from "@/lib/formatting";
import { getSourceSummary } from "@/lib/source";
import type { Snapshot, Status } from "@/lib/types";

export function StatusStrip({ snapshot }: { snapshot: Snapshot }) {
  const source = getSourceSummary(snapshot);
  const regions = ["US", "HK", "CN"].map((region) => {
    const metrics = snapshot.metrics.filter((metric) =>
      snapshot.etfs.some((etf) => etf.region === region && etf.ticker === metric.ticker)
    );
    const gaps = metrics.filter((metric) => metric.missing_critical_fields > 0).length;
    const status: Status = metrics.length === 0 || gaps > 0 ? "grey" : "green";
    const label = metrics.length === 0 ? "not loaded" : gaps > 0 ? `stale ${gaps}` : "OK";
    return { region, label, status };
  });

  return (
    <div className="mx-4 flex flex-wrap items-center gap-2 rounded-lg bg-white/85 px-4 py-2 text-xs text-zinc-600 shadow-sm ring-1 ring-zinc-200/70">
      {regions.map((item) => (
        <Badge key={item.region} status={item.status}>
          {item.region} {item.label}
        </Badge>
      ))}
      <Badge status={source.status}>{source.label}</Badge>
      <span>Generated {shortDateTime(snapshot.generated_at)}</span>
      <span>{snapshot.source_warnings.length} source warnings</span>
      <span>{source.sourceTag}</span>
    </div>
  );
}

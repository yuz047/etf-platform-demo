import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody } from "@/components/ui/panel";
import type { Snapshot, Status } from "@/lib/types";

export function HealthKpiCards({ snapshot }: { snapshot: Snapshot }) {
  const kpis: { label: string; value: number; status: Status }[] = [
    { label: "ETFs monitored", value: snapshot.etfs.length, status: "green" },
    { label: "Red ETFs", value: snapshot.metrics.filter((item) => item.health_status === "red").length, status: "red" },
    { label: "Yellow ETFs", value: snapshot.metrics.filter((item) => item.health_status === "yellow").length, status: "yellow" },
    { label: "Open tickets", value: snapshot.tickets.filter((item) => item.status === "open").length, status: "red" },
    { label: "Unresolved events", value: snapshot.events.length, status: "blue" },
    { label: "Data-quality gaps", value: snapshot.metrics.filter((item) => item.missing_critical_fields > 0).length, status: "grey" }
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(136px,1fr))] gap-3">
      {kpis.map((kpi) => (
        <Panel key={kpi.label}>
          <PanelBody className="space-y-2 p-3">
            <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
              <span className="min-w-0 text-xs leading-4 text-zinc-500">{kpi.label}</span>
              <Badge className="shrink-0" status={kpi.status} />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{kpi.value}</div>
          </PanelBody>
        </Panel>
      ))}
    </div>
  );
}

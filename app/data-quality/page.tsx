import { EvidenceTable } from "@/components/etf/EvidenceTable";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { AppShell } from "@/components/shell/AppShell";
import { getManifest, getSnapshot } from "@/lib/data";
import { getSourceSummary } from "@/lib/source";

export default function DataQualityPage() {
  const snapshot = getSnapshot();
  const manifest = getManifest();
  const sourceSummary = getSourceSummary(snapshot);
  const staleMetrics = snapshot.metrics.filter((metric) => metric.missing_critical_fields > 0 || (metric.pcf_age_days ?? 0) > 0);
  return (
    <AppShell snapshot={snapshot}>
      <div className="space-y-4 p-4">
        <Panel>
          <PanelHeader>
            <PanelTitle>Active Snapshot Source</PanelTitle>
            <Badge status={sourceSummary.status}>{sourceSummary.label}</Badge>
          </PanelHeader>
          <PanelBody className="grid gap-3 text-sm md:grid-cols-3">
            <div>
              <div className="text-xs text-zinc-500">Source</div>
              <div className="mt-1 font-medium text-zinc-950">{sourceSummary.detail}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Source tag</div>
              <div className="mt-1 font-medium text-zinc-950">{sourceSummary.sourceTag}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Redistribution</div>
              <div className="mt-1 font-medium text-zinc-950">{sourceSummary.redistribution}</div>
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <PanelTitle>Warnings & Boundary</PanelTitle>
            <span className="text-xs text-zinc-500">{snapshot.source_warnings.length} active warnings</span>
          </PanelHeader>
          <PanelBody className="space-y-3">
            <p className="text-sm leading-6 text-zinc-700">{snapshot.data_disclaimer}</p>
            <div className="flex flex-wrap gap-2">
              {snapshot.source_warnings.map((warning) => (
                <Badge key={warning} status="grey">
                  {warning}
                </Badge>
              ))}
            </div>
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <PanelTitle>Source Registry</PanelTitle>
            <span className="text-xs text-zinc-500">Source tags, license notes, retrieval status</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Source</th>
                    <th className="px-3 py-2 font-medium">Tag</th>
                    <th className="px-3 py-2 font-medium">License</th>
                    <th className="px-3 py-2 font-medium">Production</th>
                    <th className="px-3 py-2 font-medium">Redistribution</th>
                    <th className="px-3 py-2 font-medium">Last Retrieved</th>
                    <th className="px-3 py-2 font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.data_sources.map((source) => (
                    <tr className="border-b border-zinc-100" key={source.id}>
                      <td className="px-3 py-2 font-medium text-zinc-950">{source.name}</td>
                      <td className="px-3 py-2">
                        <Badge>{source.source_tag}</Badge>
                      </td>
                      <td className="px-3 py-2 text-zinc-600">{source.license_tag}</td>
                      <td className="px-3 py-2 text-zinc-600">{source.production_allowed ? "yes" : "no"}</td>
                      <td className="px-3 py-2 text-zinc-600">{source.redistribution_allowed ? "yes" : "no"}</td>
                      <td className="px-3 py-2 text-zinc-600">{source.last_retrieved_at}</td>
                      <td className="max-w-sm px-3 py-2 text-zinc-600">{source.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelBody>
        </Panel>
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <PanelHeader>
              <PanelTitle>Stale Or Missing Critical Fields</PanelTitle>
              <span className="text-xs text-zinc-500">{staleMetrics.length} ETFs</span>
            </PanelHeader>
            <PanelBody className="p-0">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">ETF</th>
                    <th className="px-3 py-2 text-right font-medium">Missing</th>
                    <th className="px-3 py-2 text-right font-medium">PCF age</th>
                    <th className="px-3 py-2 font-medium">Evidence</th>
                  </tr>
                </thead>
                <tbody>
                  {staleMetrics.map((metric) => (
                    <tr className="border-b border-zinc-100" key={metric.ticker}>
                      <td className="px-3 py-2 font-medium">{metric.ticker}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{metric.missing_critical_fields}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{metric.pcf_age_days ?? "NA"}</td>
                      <td className="px-3 py-2 text-zinc-600">{metric.evidence_ids.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader>
              <PanelTitle>Snapshot Manifest</PanelTitle>
              <span className="text-xs text-zinc-500">{manifest.latest_as_of}</span>
            </PanelHeader>
            <PanelBody className="space-y-2 text-xs text-zinc-600">
              {manifest.available_snapshots.map((item) => (
                <div className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2 last:border-0 last:pb-0" key={item.path}>
                  <span>{item.path}</span>
                  <span>
                    {item.etf_count} ETFs · {item.ticket_count} tickets · {item.source_warning_count} warnings
                  </span>
                </div>
              ))}
            </PanelBody>
          </Panel>
        </div>
        <Panel>
          <PanelHeader>
            <PanelTitle>Evidence Table</PanelTitle>
            <span className="text-xs text-zinc-500">Snapshot evidence IDs</span>
          </PanelHeader>
          <PanelBody className="p-0">
            <EvidenceTable evidence={snapshot.evidence} />
          </PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}

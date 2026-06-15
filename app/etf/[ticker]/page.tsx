import { notFound } from "next/navigation";
import { PriceNavChart } from "@/components/charts/PriceNavChart";
import { PremiumDiscountChart } from "@/components/charts/PremiumDiscountChart";
import { TrackingDiffChart } from "@/components/charts/TrackingDiffChart";
import { VolumeSpreadChart } from "@/components/charts/VolumeSpreadChart";
import { ETFHeader } from "@/components/etf/ETFHeader";
import { EvidenceTable } from "@/components/etf/EvidenceTable";
import { MetricCard } from "@/components/etf/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { AppShell } from "@/components/shell/AppShell";
import { RuleBreachTimeline } from "@/components/workflow/RuleBreachTimeline";
import { TicketCard } from "@/components/workflow/TicketCard";
import { getEtfOrThrow, getEtfRows, getEvidenceMap, getSnapshot } from "@/lib/data";
import { formatBps, formatNumber, formatPct } from "@/lib/formatting";

export function generateStaticParams() {
  return getEtfRows(getSnapshot()).map((row) => ({ ticker: row.ticker }));
}

export default async function ETFDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const snapshot = getSnapshot();
  let row;
  try {
    row = getEtfOrThrow(ticker, snapshot);
  } catch {
    notFound();
  }
  const evidenceMap = getEvidenceMap(snapshot);
  const evidence = [...row.evidence_ids, ...row.metric.evidence_ids, ...row.events.flatMap((event) => event.evidence_ids)]
    .map((id) => evidenceMap[id])
    .filter(Boolean);
  const pillars = snapshot.health_pillars.filter((pillar) => pillar.ticker === row.ticker);
  const series = snapshot.time_series[row.ticker];
  const copilot = snapshot.copilot_summaries[0];

  return (
    <AppShell snapshot={snapshot}>
      <div className="space-y-4 p-4">
        <ETFHeader row={row} />
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="ETF return" value={formatPct(row.metric.etf_return_pct)} />
          <MetricCard label="Benchmark" value={formatPct(row.metric.benchmark_return_pct)} />
          <MetricCard label="Tracking" value={formatBps(row.metric.tracking_diff_bps)} />
          <MetricCard label="Premium/Discount" value={formatBps(row.metric.premium_discount_bps)} />
          <MetricCard label="Spread" value={formatBps(row.metric.spread_bps)} />
          <MetricCard label="Volume vs 20d" value={`${formatNumber(row.metric.volume_ratio_20d, 2)}x`} />
        </div>
        <Panel>
          <PanelHeader>
            <PanelTitle>Health Pillars</PanelTitle>
          </PanelHeader>
          <PanelBody className="grid gap-2 md:grid-cols-3 xl:grid-cols-6">
            {pillars.map((pillar) => (
              <div className="border border-zinc-200 bg-zinc-50 p-3" key={pillar.pillar}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium">{pillar.label}</span>
                  <Badge status={pillar.status}>{pillar.score}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{pillar.summary}</p>
              </div>
            ))}
          </PanelBody>
        </Panel>
        {series ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <PriceNavChart series={series} />
            <TrackingDiffChart series={series} />
            <PremiumDiscountChart series={series} />
            <VolumeSpreadChart series={series} />
          </div>
        ) : null}
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <PanelHeader>
              <PanelTitle>Events & Corporate Actions</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              {row.events.map((event) => (
                <div className="border-b border-zinc-100 pb-3 text-xs last:border-0 last:pb-0" key={event.id}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-zinc-950">{event.title}</span>
                    <Badge status={event.severity} />
                  </div>
                  <p className="mt-1 text-zinc-600">{event.suggested_workflow}</p>
                </div>
              ))}
            </PanelBody>
          </Panel>
          <Panel>
            <PanelHeader>
              <PanelTitle>Rules & Tickets</PanelTitle>
            </PanelHeader>
            <PanelBody className="space-y-3">
              <RuleBreachTimeline breaches={row.breaches} />
              {row.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </PanelBody>
          </Panel>
        </div>
        <Panel>
          <PanelHeader>
            <PanelTitle>Evidence</PanelTitle>
          </PanelHeader>
          <PanelBody className="p-0">
            <EvidenceTable evidence={evidence} />
          </PanelBody>
        </Panel>
        <Panel>
          <PanelHeader>
            <PanelTitle>Copilot Summary</PanelTitle>
            <span className="text-xs text-zinc-500">{copilot?.label}</span>
          </PanelHeader>
          <PanelBody className="text-sm leading-6 text-zinc-700">{copilot?.summary}</PanelBody>
        </Panel>
      </div>
    </AppShell>
  );
}

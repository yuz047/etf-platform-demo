import Link from "next/link";
import { PriceNavChart } from "@/components/charts/PriceNavChart";
import { PremiumDiscountChart } from "@/components/charts/PremiumDiscountChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { RuleBreachTimeline } from "@/components/workflow/RuleBreachTimeline";
import { TicketCard } from "@/components/workflow/TicketCard";
import { formatBps, formatMultiple, formatPct } from "@/lib/formatting";
import type { ETFRow, Evidence, Snapshot } from "@/lib/types";
import { EvidenceTable } from "./EvidenceTable";

export function ETFDetailDrawer({
  row,
  snapshot,
  evidence,
  onClose
}: {
  row: ETFRow;
  snapshot: Snapshot;
  evidence: Evidence[];
  onClose: () => void;
}) {
  const pillars = snapshot.health_pillars.filter((pillar) => pillar.ticker === row.ticker);
  const series = snapshot.time_series[row.ticker];

  return (
    <aside className="w-full max-w-[520px] bg-white shadow-[inset_1px_0_0_rgba(228,228,231,0.75)]">
      <div className="sticky top-14 max-h-[calc(100vh-56px)] overflow-y-auto">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">{row.ticker}</h2>
              <Badge status={row.metric.health_status} />
            </div>
            <div className="mt-1 text-sm text-zinc-600">{row.name}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {row.region} · {row.asset_class} · {row.benchmark_proxy}
            </div>
          </div>
          <Button aria-label="Close ETF detail drawer" onClick={onClose} variant="outline">
            Esc
          </Button>
        </div>

        <div className="space-y-4 p-4">
          <Panel>
            <PanelHeader>
              <PanelTitle>Primary Reason</PanelTitle>
              <span className="text-xs text-zinc-500">Score {row.metric.health_score}</span>
            </PanelHeader>
            <PanelBody className="grid gap-3 text-sm">
              <div className="font-medium text-zinc-950">{row.metric.primary_reason}</div>
              <div className="grid grid-cols-2 gap-2 text-xs text-zinc-600">
                <span>Return {formatPct(row.metric.etf_return_pct)}</span>
                <span>Benchmark {formatPct(row.metric.benchmark_return_pct)}</span>
                <span>Tracking {formatBps(row.metric.tracking_diff_bps)}</span>
                <span>P/D {formatBps(row.metric.premium_discount_bps)}</span>
                <span>Spread {formatBps(row.metric.spread_bps)}</span>
                <span>Volume {formatMultiple(row.metric.volume_ratio_20d)}</span>
                <span>GARCH {formatPct(row.metric.garch_vol_forecast_1d_pct)}</span>
              </div>
            </PanelBody>
          </Panel>

          <div className="grid grid-cols-2 gap-2">
            {pillars.map((pillar) => (
              <div className="rounded-md bg-zinc-50 p-3 ring-1 ring-zinc-200/70" key={pillar.pillar}>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-medium text-zinc-700">{pillar.label}</div>
                  <Badge status={pillar.status}>{pillar.score}</Badge>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-600">{pillar.summary}</p>
              </div>
            ))}
          </div>

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

          {series ? (
            <div className="grid gap-4">
              <PriceNavChart series={series} />
              <PremiumDiscountChart series={series} />
            </div>
          ) : null}

          <Panel>
            <PanelHeader>
              <PanelTitle>Evidence</PanelTitle>
              <Link className="text-xs font-medium text-zinc-700 hover:text-zinc-950" href={`/etf/${row.ticker}`}>
                Detail page
              </Link>
            </PanelHeader>
            <PanelBody className="p-0">
              <EvidenceTable evidence={evidence} />
            </PanelBody>
          </Panel>
        </div>
      </div>
    </aside>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@heroui/react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { ETFDetailDrawer } from "@/components/etf/ETFDetailDrawer";
import type { ETFRow, Evidence, Snapshot } from "@/lib/types";
import { ETFHealthTable } from "./ETFHealthTable";
import { EventInboxPreview } from "./EventInboxPreview";
import { HealthKpiCards } from "./HealthKpiCards";
import { SourceModeBanner } from "./SourceModeBanner";
import { TicketQueue } from "./TicketQueue";
import { VolatilityForecastPanel } from "./VolatilityForecastPanel";

type Filter = "All" | "Red/Yellow" | "Semiconductors" | "US" | "HK" | "CN" | "Open Tickets" | "Data Gaps" | "Corporate Actions";
const filters: Filter[] = ["All", "Red/Yellow", "Semiconductors", "US", "HK", "CN", "Open Tickets", "Data Gaps", "Corporate Actions"];

export function ControlTowerClient({
  snapshot,
  rows,
  evidenceById
}: {
  snapshot: Snapshot;
  rows: ETFRow[];
  evidenceById: Record<string, Evidence>;
}) {
  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [selectedTicker, setSelectedTicker] = useState(rows[0]?.ticker ?? "");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDrawerOpen(false);
      }
      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const visibleRows = useMemo(
    () =>
      rows.filter((row) => matchesFilter(row, filter)).filter((row) => {
        const text = `${row.ticker} ${row.name} ${row.region} ${row.asset_class} ${row.metric.primary_reason}`.toLowerCase();
        return text.includes(search.toLowerCase());
      }),
    [filter, rows, search]
  );
  const selectedRow = rows.find((row) => row.ticker === selectedTicker) ?? visibleRows[0] ?? rows[0];
  const selectedEvidence = selectedRow
    ? [...selectedRow.evidence_ids, ...selectedRow.metric.evidence_ids, ...selectedRow.events.flatMap((event) => event.evidence_ids)]
        .map((id) => evidenceById[id])
        .filter(Boolean)
    : [];
  const copilot = snapshot.copilot_summaries[0];
  const copilotEvidence = copilot?.evidence_ids.map((id) => evidenceById[id]).filter(Boolean) ?? [];

  return (
    <div className="flex">
      <div className="min-w-0 flex-1 space-y-4 p-4">
        <HealthKpiCards snapshot={snapshot} />
        <SourceModeBanner snapshot={snapshot} />
        <VolatilityForecastPanel rows={rows} />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 min-w-72 items-center gap-2 rounded-md bg-white px-2 text-xs text-zinc-500 shadow-sm ring-1 ring-zinc-200/70">
            <Search className="h-3.5 w-3.5" />
            <Input
              className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 text-xs text-zinc-900 shadow-none"
              fullWidth
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ETF, region, reason"
              ref={searchRef}
              type="search"
              value={search}
              variant="secondary"
            />
          </div>
          {filters.map((item) => (
            <Button
              aria-pressed={filter === item}
              key={item}
              onClick={() => setFilter(item)}
              variant={filter === item ? "default" : "outline"}
            >
              {item}
            </Button>
          ))}
        </div>
        <ETFHealthTable
          rows={visibleRows}
          onSelect={(ticker) => {
            setSelectedTicker(ticker);
            setDrawerOpen(true);
          }}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          <EventInboxPreview events={snapshot.events} />
          <TicketQueue tickets={snapshot.tickets} />
        </div>
        <CopilotPanel evidence={copilotEvidence} summary={copilot} />
      </div>
      {drawerOpen && selectedRow ? (
        <>
          <div aria-hidden="true" className="fixed inset-0 z-30 bg-zinc-950/10 2xl:hidden" onClick={() => setDrawerOpen(false)} />
          <div className="fixed bottom-4 right-4 top-[72px] z-40 w-[min(460px,calc(100vw-2rem))] 2xl:hidden">
            <ETFDetailDrawer evidence={selectedEvidence} onClose={() => setDrawerOpen(false)} row={selectedRow} snapshot={snapshot} />
          </div>
          <div className="hidden w-[520px] shrink-0 py-4 pr-4 2xl:block">
            <ETFDetailDrawer evidence={selectedEvidence} onClose={() => setDrawerOpen(false)} row={selectedRow} snapshot={snapshot} />
          </div>
        </>
      ) : null}
    </div>
  );
}

function matchesFilter(row: ETFRow, filter: Filter) {
  if (filter === "All") {
    return true;
  }
  if (filter === "Red/Yellow") {
    return row.metric.health_status === "red" || row.metric.health_status === "yellow";
  }
  if (filter === "Open Tickets") {
    return row.tickets.length > 0;
  }
  if (filter === "Semiconductors") {
    return row.asset_class.toLowerCase().includes("semiconductor");
  }
  if (filter === "Data Gaps") {
    return row.metric.missing_critical_fields > 0;
  }
  if (filter === "Corporate Actions") {
    return row.metric.open_ca_count > 0;
  }
  return row.region === filter;
}

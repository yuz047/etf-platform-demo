"use client";

import Link from "next/link";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState
} from "@tanstack/react-table";
import { useMemo, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { compareStatus } from "@/lib/health";
import { formatAum, formatBps, formatMultiple, formatNumber, formatPct, shortDateTime } from "@/lib/formatting";
import { cn } from "@/lib/utils";
import type { ETFRow, Status } from "@/lib/types";

const columnHelper = createColumnHelper<ETFRow>();
const numericColumnIds = new Set([
  "aum",
  "return",
  "benchmark",
  "tracking",
  "premiumDiscount",
  "spread",
  "volume",
  "garchVol",
  "volZ",
  "ca",
  "tickets"
]);
const toneClass: Partial<Record<Status, string>> = {
  red: "border-red-200 bg-red-50 text-red-700",
  yellow: "border-yellow-200 bg-yellow-50 text-yellow-800",
  grey: "border-zinc-200 bg-zinc-100 text-zinc-700",
  blue: "border-blue-200 bg-blue-50 text-blue-700"
};

export function ETFHealthTable({
  rows,
  onSelect
}: {
  rows: ETFRow[];
  onSelect: (ticker: string) => void;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const sortedRows = useMemo(
    () =>
      [...rows].sort((a, b) => {
        const status = compareStatus(a.metric.health_status, b.metric.health_status);
        return status || b.metric.health_score - a.metric.health_score;
      }),
    [rows]
  );
  const columns = useMemo(
    () => [
      columnHelper.accessor((row) => row.metric.health_status, {
        id: "status",
        header: "Status",
        cell: (info) => <Badge status={info.getValue()} />
      }),
      columnHelper.accessor("ticker", {
        header: "ETF",
        cell: (info) => (
          <Link className="font-semibold text-zinc-950 hover:underline" href={`/etf/${info.getValue()}`} onClick={(event) => event.stopPropagation()}>
            {info.getValue()}
          </Link>
        )
      }),
      columnHelper.accessor("name", {
        header: "Name",
        cell: (info) => <span className="block max-w-56 truncate">{info.getValue()}</span>
      }),
      columnHelper.accessor("region", { header: "Region" }),
      columnHelper.accessor((row) => row.aum_millions, {
        id: "aum",
        header: "AUM",
        cell: (info) => <PlainNumber>{formatAum(info.getValue(), info.row.original.currency)}</PlainNumber>
      }),
      columnHelper.accessor((row) => row.metric.etf_return_pct, {
        id: "return",
        header: "Return",
        cell: (info) => <PlainNumber>{formatPct(info.getValue())}</PlainNumber>
      }),
      columnHelper.accessor((row) => row.metric.benchmark_return_pct, {
        id: "benchmark",
        header: "Benchmark",
        cell: (info) => <PlainNumber>{formatPct(info.getValue())}</PlainNumber>
      }),
      columnHelper.accessor((row) => row.metric.tracking_diff_bps, {
        id: "tracking",
        header: "Tracking",
        cell: (info) => <MetricValue tone={trackingTone(info.getValue())}>{formatBps(info.getValue())}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.premium_discount_bps, {
        id: "premiumDiscount",
        header: "P/D",
        cell: (info) => <MetricValue tone={premiumTone(info.getValue())}>{formatBps(info.getValue())}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.spread_bps, {
        id: "spread",
        header: "Spread",
        cell: (info) => <MetricValue tone={spreadTone(info.getValue())}>{formatBps(info.getValue())}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.volume_ratio_20d, {
        id: "volume",
        header: "Volume vs 20d",
        cell: (info) => <MetricValue tone={volumeTone(info.getValue())}>{formatMultiple(info.getValue())}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.garch_vol_forecast_1d_pct, {
        id: "garchVol",
        header: "GARCH vol",
        cell: (info) => <PlainNumber>{formatPct(info.getValue())}</PlainNumber>
      }),
      columnHelper.accessor((row) => row.metric.realized_vol_zscore, {
        id: "volZ",
        header: "Vol z",
        cell: (info) => <MetricValue tone={volTone(info.getValue())}>{formatNumber(info.getValue(), 2)}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.open_ca_count, {
        id: "ca",
        header: "CA",
        cell: (info) => <MetricValue tone={info.getValue() > 0 ? "red" : undefined}>{info.getValue()}</MetricValue>
      }),
      columnHelper.accessor((row) => row.tickets.length, {
        id: "tickets",
        header: "Tickets",
        cell: (info) => <MetricValue tone={ticketTone(info.row.original)}>{info.getValue()}</MetricValue>
      }),
      columnHelper.accessor((row) => row.metric.primary_reason, {
        id: "reason",
        header: "Primary reason",
        cell: (info) => <ReasonCell row={info.row.original} />
      }),
      columnHelper.accessor((row) => row.metric.updated_at, {
        id: "updated",
        header: "Updated",
        cell: (info) => <span className="whitespace-nowrap text-zinc-500">{shortDateTime(info.getValue()).replace(":00 UTC", " UTC")}</span>
      })
    ],
    []
  );
  const table = useReactTable({
    data: sortedRows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="overflow-x-auto border border-zinc-200 bg-white">
      <table className="w-full min-w-[1420px] border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className={cn("whitespace-nowrap px-3 py-2 font-medium", numericColumnIds.has(header.column.id) && "text-right")} key={header.id}>
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              className="cursor-pointer border-t border-zinc-100 text-zinc-700 hover:bg-zinc-50"
              data-testid="etf-health-row"
              data-ticker={row.original.ticker}
              key={row.id}
              onClick={() => onSelect(row.original.ticker)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  className={cn(
                    "px-3 py-2 align-middle",
                    numericColumnIds.has(cell.column.id) && "text-right",
                    cell.column.id === "reason" && "min-w-[260px]",
                    cell.column.id === "updated" && "whitespace-nowrap"
                  )}
                  key={cell.id}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlainNumber({ children }: { children: string }) {
  return <span className="whitespace-nowrap tabular-nums text-zinc-800">{children}</span>;
}

function MetricValue({ children, tone }: { children: ReactNode; tone?: Status }) {
  return (
    <span
      className={cn(
        "inline-flex min-w-20 justify-end whitespace-nowrap rounded-md border border-transparent px-2 py-1 font-medium tabular-nums text-zinc-700",
        tone && toneClass[tone]
      )}
    >
      {children}
    </span>
  );
}

function ReasonCell({ row }: { row: ETFRow }) {
  const reason = reasonCopy(row);
  return (
    <div className="max-w-[320px]">
      <div className="font-medium text-zinc-900">{reason.title}</div>
      <div className="mt-0.5 leading-4 text-zinc-500">{reason.detail}</div>
    </div>
  );
}

function reasonCopy(row: ETFRow) {
  const metric = row.metric;
  const rule = metric.primary_reason;

  if (rule === "OK") {
    return { title: "No active breach", detail: "Daily metrics are inside current demo thresholds." };
  }
  if (rule.startsWith("TRACKING_DIFF")) {
    const value = metric.tracking_diff_bps ?? 0;
    return {
      title: rule === "TRACKING_DIFF_RED" ? "Tracking red threshold" : "Tracking review",
      detail: `ETF return is ${formatBps(Math.abs(value))} ${value < 0 ? "below" : "above"} benchmark proxy.`
    };
  }
  if (rule === "PREMIUM_DISCOUNT_WARN") {
    return {
      title: "Premium/discount review",
      detail: `Price is ${formatBps(Math.abs(metric.premium_discount_bps ?? 0))} from NAV proxy.`
    };
  }
  if (rule === "SPREAD_WIDE") {
    return { title: "Spread review", detail: `Bid-ask spread is ${formatBps(metric.spread_bps)}; liquidity cost looks wide.` };
  }
  if (rule === "VOLUME_LOW") {
    return { title: "Volume review", detail: `Volume is ${formatMultiple(metric.volume_ratio_20d)} the 20-day average.` };
  }
  if (rule === "VOLATILITY_HIGH") {
    return {
      title: "Volatility review",
      detail: `Realized vol z-score is ${formatNumber(metric.realized_vol_zscore, 2)}; GARCH forecast is ${formatPct(metric.garch_vol_forecast_1d_pct)}.`
    };
  }
  if (rule === "CORPORATE_ACTION_UNRESOLVED") {
    return { title: "Corporate action open", detail: `${metric.open_ca_count} holding event requires operations review.` };
  }
  if (rule === "PCF_STALE") {
    return { title: "PCF stale", detail: `PCF age is ${metric.pcf_age_days ?? "NA"} day(s).` };
  }
  if (rule === "DATA_QUALITY_GAP") {
    return { title: "Data gap", detail: `${metric.missing_critical_fields} critical field(s) missing.` };
  }
  return { title: rule, detail: "Rule breach requires owner review." };
}

function trackingTone(value: number | null | undefined): Status | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const absolute = Math.abs(value);
  if (absolute > 100) {
    return "red";
  }
  if (absolute > 50) {
    return "yellow";
  }
  return undefined;
}

function premiumTone(value: number | null | undefined): Status | undefined {
  return value !== null && value !== undefined && Math.abs(value) > 75 ? "yellow" : undefined;
}

function spreadTone(value: number | null | undefined): Status | undefined {
  return value !== null && value !== undefined && value > 30 ? "yellow" : undefined;
}

function volumeTone(value: number | null | undefined): Status | undefined {
  return value !== null && value !== undefined && value < 0.5 ? "yellow" : undefined;
}

function volTone(value: number | null | undefined): Status | undefined {
  return value !== null && value !== undefined && value > 2 ? "yellow" : undefined;
}

function ticketTone(row: ETFRow): Status | undefined {
  if (row.tickets.some((ticket) => ticket.severity === "red")) {
    return "red";
  }
  if (row.tickets.some((ticket) => ticket.severity === "yellow")) {
    return "yellow";
  }
  if (row.tickets.some((ticket) => ticket.severity === "grey")) {
    return "grey";
  }
  return undefined;
}

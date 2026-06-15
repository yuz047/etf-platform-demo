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
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { compareStatus } from "@/lib/health";
import { formatAum, formatBps, formatNumber, formatPct } from "@/lib/formatting";
import type { ETFRow } from "@/lib/types";

const columnHelper = createColumnHelper<ETFRow>();

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
        cell: (info) => <span className="tabular-nums">{formatAum(info.getValue(), info.row.original.currency)}</span>
      }),
      columnHelper.accessor((row) => row.metric.etf_return_pct, {
        id: "return",
        header: "Return",
        cell: (info) => <span className="tabular-nums">{formatPct(info.getValue())}</span>
      }),
      columnHelper.accessor((row) => row.metric.benchmark_return_pct, {
        id: "benchmark",
        header: "Benchmark",
        cell: (info) => <span className="tabular-nums">{formatPct(info.getValue())}</span>
      }),
      columnHelper.accessor((row) => row.metric.tracking_diff_bps, {
        id: "tracking",
        header: "Tracking bps",
        cell: (info) => <span className="tabular-nums">{formatBps(info.getValue())}</span>
      }),
      columnHelper.accessor((row) => row.metric.premium_discount_bps, {
        id: "premiumDiscount",
        header: "P/D bps",
        cell: (info) => <span className="tabular-nums">{formatBps(info.getValue())}</span>
      }),
      columnHelper.accessor((row) => row.metric.spread_bps, {
        id: "spread",
        header: "Spread bps",
        cell: (info) => <span className="tabular-nums">{formatBps(info.getValue())}</span>
      }),
      columnHelper.accessor((row) => row.metric.volume_ratio_20d, {
        id: "volume",
        header: "Volume vs 20d",
        cell: (info) => <span className="tabular-nums">{formatNumber(info.getValue(), 2)}x</span>
      }),
      columnHelper.accessor((row) => row.metric.realized_vol_zscore, {
        id: "volZ",
        header: "Vol z",
        cell: (info) => <span className="tabular-nums">{formatNumber(info.getValue(), 2)}</span>
      }),
      columnHelper.accessor((row) => row.metric.open_ca_count, {
        id: "ca",
        header: "CA",
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>
      }),
      columnHelper.accessor((row) => row.tickets.length, {
        id: "tickets",
        header: "Tickets",
        cell: (info) => <span className="tabular-nums">{info.getValue()}</span>
      }),
      columnHelper.accessor((row) => row.metric.primary_reason, {
        id: "reason",
        header: "Primary reason"
      }),
      columnHelper.accessor((row) => row.metric.updated_at, {
        id: "updated",
        header: "Updated"
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
      <table className="w-full min-w-[1320px] border-collapse text-left text-xs">
        <thead className="sticky top-0 bg-zinc-50 text-zinc-500">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th className="px-3 py-2 font-medium" key={header.id}>
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
                <td className="px-3 py-2" key={cell.id}>
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

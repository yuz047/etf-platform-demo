"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Panel, PanelBody, PanelHeader, PanelTitle } from "@/components/ui/panel";
import { formatNumber, formatPct } from "@/lib/formatting";
import type { ETFRow } from "@/lib/types";

export function VolatilityForecastPanel({ rows }: { rows: ETFRow[] }) {
  const [mounted, setMounted] = useState(false);
  const rankedRows = useMemo(
    () =>
      [...rows]
        .filter((row) => row.metric.garch_vol_forecast_1d_pct !== null && row.metric.garch_vol_forecast_1d_pct !== undefined)
        .sort((a, b) => (b.metric.garch_vol_forecast_1d_pct ?? 0) - (a.metric.garch_vol_forecast_1d_pct ?? 0)),
    [rows]
  );
  const chartData = rankedRows.slice(0, 10).map((row) => ({
    forecast: row.metric.garch_vol_forecast_1d_pct,
    realized: row.metric.realized_vol_20d_pct,
    ticker: row.ticker,
    zScore: row.metric.realized_vol_zscore
  }));
  const highZCount = rows.filter((row) => (row.metric.realized_vol_zscore ?? 0) > 2).length;
  const maxForecast = rankedRows[0]?.metric.garch_vol_forecast_1d_pct ?? null;
  const medianForecast = median(rankedRows.map((row) => row.metric.garch_vol_forecast_1d_pct).filter((value): value is number => value !== null && value !== undefined));

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Volatility Forecast</PanelTitle>
        <span className="text-xs text-zinc-500">GARCH(1,1) annualized next-session estimate</span>
      </PanelHeader>
      <PanelBody className="grid gap-4 2xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="min-w-0">
          <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(112px,1fr))] gap-2 text-xs">
            <Summary label="Max forecast" value={formatPct(maxForecast)} />
            <Summary label="Median forecast" value={formatPct(medianForecast)} />
            <Summary label="High vol z" value={`${highZCount} ETFs`} />
          </div>
          <div className="h-64">
            {mounted ? (
              <ResponsiveContainer height="100%" minHeight={220} minWidth={280} width="100%">
                <BarChart data={chartData} margin={{ bottom: 0, left: 0, right: 10, top: 8 }}>
                  <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
                  <XAxis dataKey="ticker" fontSize={10} tickLine={false} />
                  <YAxis fontSize={10} tickFormatter={(value) => `${value}%`} tickLine={false} width={42} />
                  <Tooltip
                    contentStyle={{ border: "1px solid #e4e4e7", borderRadius: 6, fontSize: 12 }}
                    formatter={(value, name) => [formatPct(Number(value)), name === "forecast" ? "GARCH forecast" : "20d realized vol"]}
                  />
                  <Bar dataKey="forecast" fill="#2563eb" name="forecast" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="realized" fill="#94a3b8" name="realized" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-zinc-50" />
            )}
          </div>
        </div>
        <div className="min-w-0 overflow-x-auto">
          <table className="w-full min-w-[360px] text-left text-xs">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">ETF</th>
                <th className="px-3 py-2 text-right font-medium">GARCH</th>
                <th className="px-3 py-2 text-right font-medium">Vol z</th>
                <th className="px-3 py-2 font-medium">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rankedRows.slice(0, 6).map((row) => (
                <tr className="border-b border-zinc-100" key={row.ticker}>
                  <td className="px-3 py-2 font-semibold text-zinc-950">{row.ticker}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatPct(row.metric.garch_vol_forecast_1d_pct)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    <Badge status={(row.metric.realized_vol_zscore ?? 0) > 2 ? "yellow" : "green"}>
                      {formatNumber(row.metric.realized_vol_zscore, 2)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-zinc-600">{volatilityReason(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelBody>
    </Panel>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-zinc-50 p-2 ring-1 ring-zinc-200/70">
      <div className="text-zinc-500">{label}</div>
      <div className="mt-1 font-semibold tabular-nums text-zinc-950">{value}</div>
    </div>
  );
}

function volatilityReason(row: ETFRow) {
  if ((row.metric.realized_vol_zscore ?? 0) > 2) {
    return "Current realized vol is high versus its 1-year rolling baseline.";
  }
  if ((row.metric.garch_vol_forecast_1d_pct ?? 0) > (row.metric.realized_vol_20d_pct ?? 0)) {
    return "Forecast is above current 20-day realized vol.";
  }
  return "Forecast is below or near current realized vol.";
}

function median(values: number[]) {
  if (!values.length) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

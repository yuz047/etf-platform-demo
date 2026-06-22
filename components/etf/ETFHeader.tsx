import { HealthBadge } from "@/components/etf/HealthBadge";
import { formatAum } from "@/lib/formatting";
import type { ETFRow } from "@/lib/types";

export function ETFHeader({ row }: { row: ETFRow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-zinc-200/70">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{row.ticker}</h1>
          <HealthBadge status={row.metric.health_status} />
        </div>
        <p className="mt-1 text-sm text-zinc-600">{row.name}</p>
        <p className="mt-1 text-xs text-zinc-500">
          {row.region} · {row.currency} · {row.asset_class} · benchmark proxy {row.benchmark_proxy} · AUM{" "}
          {formatAum(row.aum_millions, row.currency)}
        </p>
      </div>
      <div className="text-right text-xs text-zinc-500">
        <div>Health score</div>
        <div className="text-2xl font-semibold tabular-nums text-zinc-950">{row.metric.health_score}</div>
      </div>
    </div>
  );
}

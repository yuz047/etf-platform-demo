import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function VolumeSpreadChart({ series }: { series: TickerTimeSeries }) {
  return (
    <BaseLineChart
      data={series.volume_spread}
      lines={[
        { key: "volume_ratio", color: "#2563eb" },
        { key: "spread_bps", color: "#dc2626" }
      ]}
      title="Volume / Spread Proxy"
    />
  );
}

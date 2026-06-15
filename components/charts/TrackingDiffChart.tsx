import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function TrackingDiffChart({ series }: { series: TickerTimeSeries }) {
  return <BaseLineChart data={series.tracking_diff} lines={[{ key: "value", color: "#7c3aed" }]} tag="Toy benchmark" title="Tracking Difference" />;
}

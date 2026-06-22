import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function TrackingDiffChart({ series }: { series: TickerTimeSeries }) {
  const tag = series.tracking_diff.find((point) => point.quality_tag)?.quality_tag ?? "Toy benchmark";
  return <BaseLineChart data={series.tracking_diff} lines={[{ key: "value", color: "#7c3aed" }]} tag={tag} title="Tracking Difference" />;
}

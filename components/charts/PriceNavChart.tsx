import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function PriceNavChart({ series }: { series: TickerTimeSeries }) {
  return <BaseLineChart data={series.price_nav} lines={[{ key: "price", color: "#2563eb" }, { key: "nav", color: "#059669" }]} title="Price vs NAV Proxy" />;
}

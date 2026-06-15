import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function PremiumDiscountChart({ series }: { series: TickerTimeSeries }) {
  return <BaseLineChart data={series.premium_discount} lines={[{ key: "value", color: "#d97706" }]} tag="Proxy data" title="Premium / Discount Proxy" />;
}

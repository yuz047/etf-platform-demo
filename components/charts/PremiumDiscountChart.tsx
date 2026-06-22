import type { TickerTimeSeries } from "@/lib/types";
import { BaseLineChart } from "./BaseLineChart";

export function PremiumDiscountChart({ series }: { series: TickerTimeSeries }) {
  const tag = series.premium_discount.find((point) => point.quality_tag)?.quality_tag ?? "Proxy data";
  return <BaseLineChart data={series.premium_discount} lines={[{ key: "value", color: "#d97706" }]} tag={tag} title="Premium / Discount Proxy" />;
}

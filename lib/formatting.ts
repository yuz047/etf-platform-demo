export function formatNumber(value: number | null | undefined, digits = 0) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "NA";
  }
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  }).format(value);
}

export function formatPct(value: number | null | undefined, digits = 2) {
  return value === null || value === undefined ? "NA" : `${formatNumber(value, digits)}%`;
}

export function formatBps(value: number | null | undefined) {
  return value === null || value === undefined ? "NA" : `${formatNumber(value, 0)} bps`;
}

export function formatAum(value: number | null | undefined, currency: string) {
  return value === null || value === undefined ? "NA" : `${currency} ${formatNumber(value, 0)}m`;
}

export function shortDateTime(value: string) {
  return value.replace("T", " ").replace("Z", " UTC");
}

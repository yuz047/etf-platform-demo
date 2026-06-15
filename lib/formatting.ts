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
  return value === null || value === undefined || Number.isNaN(value) ? "NA" : `${formatNumber(value, digits)}%`;
}

export function formatBps(value: number | null | undefined) {
  return value === null || value === undefined || Number.isNaN(value) ? "NA" : `${formatNumber(value, 0)} bps`;
}

export function formatMultiple(value: number | null | undefined, digits = 2) {
  return value === null || value === undefined || Number.isNaN(value) ? "NA" : `${formatNumber(value, digits)}x`;
}

export function formatAum(value: number | null | undefined, currency: string) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "NA";
  }

  const prefix = currency === "USD" ? "$" : currency === "HKD" ? "HK$" : `${currency} `;
  const absolute = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absolute >= 1_000_000) {
    return `${sign}${prefix}${formatNumber(absolute / 1_000_000, 1)}T`;
  }
  if (absolute >= 1_000) {
    return `${sign}${prefix}${formatNumber(absolute / 1_000, 1)}B`;
  }
  return `${sign}${prefix}${formatNumber(absolute, 0)}M`;
}

export function shortDateTime(value: string) {
  return value.replace("T", " ").replace("Z", " UTC");
}

export function formatOwner(value: string) {
  return value === "PM" ? "Portfolio Manager" : value;
}

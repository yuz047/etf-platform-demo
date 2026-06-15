import { readFileSync } from "node:fs";
import { join } from "node:path";
import { manifestSchema, snapshotSchema } from "./schema";
import type { ETFRow, Evidence, Manifest, Snapshot } from "./types";

let snapshotCache: Snapshot | null = null;
let manifestCache: Manifest | null = null;

export function getSnapshot(): Snapshot {
  if (snapshotCache) {
    return snapshotCache;
  }
  const raw = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "latest.json"), "utf8"));
  snapshotCache = snapshotSchema.parse(raw);
  return snapshotCache;
}

export function getManifest(): Manifest {
  if (manifestCache) {
    return manifestCache;
  }
  const raw = JSON.parse(readFileSync(join(process.cwd(), "public", "data", "manifest.json"), "utf8"));
  manifestCache = manifestSchema.parse(raw);
  return manifestCache;
}

export function getEtfRows(snapshot = getSnapshot()): ETFRow[] {
  return snapshot.etfs.map((etf) => {
    const metric = snapshot.metrics.find((item) => item.ticker === etf.ticker);
    if (!metric) {
      throw new Error(`Missing metric row for ${etf.ticker}`);
    }
    return {
      ...etf,
      metric,
      tickets: snapshot.tickets.filter((ticket) => ticket.ticker === etf.ticker),
      breaches: snapshot.rule_breaches.filter((breach) => breach.ticker === etf.ticker),
      events: snapshot.events.filter((event) => event.impacted_tickers.includes(etf.ticker))
    };
  });
}

export function getEvidenceMap(snapshot = getSnapshot()): Record<string, Evidence> {
  return Object.fromEntries(snapshot.evidence.map((item) => [item.id, item]));
}

export function getEtfOrThrow(ticker: string, snapshot = getSnapshot()): ETFRow {
  const row = getEtfRows(snapshot).find((item) => item.ticker === ticker);
  if (!row) {
    throw new Error(`Unknown ETF ticker: ${ticker}`);
  }
  return row;
}

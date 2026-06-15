import { describe, expect, it } from "vitest";
import { getSourceSummary } from "./source";
import type { Snapshot } from "./types";

const baseSnapshot = {
  data_sources: [
    {
      id: "src_seed",
      name: "Seed data",
      region: "GLOBAL",
      source_tag: "mock_seed",
      source_type: "mock_seed",
      license_tag: "public_demo_seed",
      production_allowed: false,
      redistribution_allowed: true,
      last_retrieved_at: "2026-06-14T22:30:00Z",
      status: "ok",
      notes: "Synthetic data."
    }
  ]
} as Snapshot;

describe("getSourceSummary", () => {
  it("labels seed snapshots", () => {
    expect(getSourceSummary(baseSnapshot).label).toBe("Seed demo snapshot");
  });

  it("labels Yahoo test snapshots", () => {
    const snapshot = {
      ...baseSnapshot,
      data_sources: [
        {
          ...baseSnapshot.data_sources[0],
          id: "src_yahoo_finance_test",
          name: "Yahoo Finance test feed via yfinance",
          source_tag: "unknown_license",
          source_type: "yahoo_finance_test",
          redistribution_allowed: false
        }
      ]
    } as Snapshot;
    const summary = getSourceSummary(snapshot);
    expect(summary.label).toBe("Yahoo test feed");
    expect(summary.redistribution).toBe("no redistribution assumed");
  });
});

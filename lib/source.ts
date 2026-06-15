import type { Snapshot, Status } from "./types";

export type SourceSummary = {
  label: string;
  detail: string;
  status: Status;
  sourceTag: string;
  redistribution: string;
};

export function getSourceSummary(snapshot: Snapshot): SourceSummary {
  const yahooSource = snapshot.data_sources.find((source) => source.source_type === "yahoo_finance_test");
  if (yahooSource) {
    return {
      label: "Yahoo test feed",
      detail: yahooSource.name,
      status: "grey",
      sourceTag: yahooSource.source_tag,
      redistribution: yahooSource.redistribution_allowed ? "redistribution allowed" : "no redistribution assumed"
    };
  }

  const seedSource = snapshot.data_sources.find((source) => source.source_tag === "mock_seed");
  return {
    label: "Seed demo snapshot",
    detail: seedSource?.name ?? "Seed data",
    status: "green",
    sourceTag: seedSource?.source_tag ?? "mock_seed",
    redistribution: seedSource?.redistribution_allowed ? "redistribution allowed" : "no redistribution assumed"
  };
}

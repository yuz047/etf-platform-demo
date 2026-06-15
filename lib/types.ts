import type { z } from "zod";
import type {
  backtestSchema,
  copilotSchema,
  dataSourceSchema,
  etfSchema,
  eventSchema,
  evidenceSchema,
  healthPillarSchema,
  manifestSchema,
  metricSchema,
  ruleDefinitionSchema,
  ruleBreachSchema,
  snapshotSchema,
  statusSchema,
  ticketSchema,
  tickerTimeSeriesSchema,
  workflowCheckpointSchema,
  workflowQueueSchema
} from "./schema";

export type Status = z.infer<typeof statusSchema>;
export type ETF = z.infer<typeof etfSchema>;
export type ETFMetric = z.infer<typeof metricSchema>;
export type HealthPillar = z.infer<typeof healthPillarSchema>;
export type EventItem = z.infer<typeof eventSchema>;
export type RuleBreach = z.infer<typeof ruleBreachSchema>;
export type RuleDefinition = z.infer<typeof ruleDefinitionSchema>;
export type Ticket = z.infer<typeof ticketSchema>;
export type Evidence = z.infer<typeof evidenceSchema>;
export type DataSource = z.infer<typeof dataSourceSchema>;
export type TickerTimeSeries = z.infer<typeof tickerTimeSeriesSchema>;
export type BacktestSummary = z.infer<typeof backtestSchema>;
export type CopilotSummary = z.infer<typeof copilotSchema>;
export type WorkflowCheckpoint = z.infer<typeof workflowCheckpointSchema>;
export type WorkflowQueue = z.infer<typeof workflowQueueSchema>;
export type Snapshot = z.infer<typeof snapshotSchema>;
export type Manifest = z.infer<typeof manifestSchema>;

export type ETFRow = ETF & {
  metric: ETFMetric;
  tickets: Ticket[];
  breaches: RuleBreach[];
  events: EventItem[];
};

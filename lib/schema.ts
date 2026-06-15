import { z } from "zod";

export const statusSchema = z.enum(["green", "yellow", "red", "grey", "blue"]);
export const sourceTagSchema = z.enum([
  "mock_seed",
  "public_official",
  "open_source_research",
  "licensed_vendor_placeholder",
  "internal_placeholder",
  "unknown_license"
]);
export const ownerSchema = z.enum(["PM", "Ops", "Risk", "Compliance", "Capital Markets", "Data"]);
export const ticketStatusSchema = z.enum(["open", "reviewing", "resolved", "waived"]);

export const etfSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  region: z.enum(["US", "HK", "CN"]),
  currency: z.string(),
  asset_class: z.string(),
  benchmark_proxy: z.string(),
  aum_millions: z.number(),
  expense_ratio_bps: z.number(),
  source_tag: sourceTagSchema,
  evidence_ids: z.array(z.string())
});

export const metricSchema = z.object({
  ticker: z.string(),
  as_of: z.string(),
  health_status: statusSchema,
  health_score: z.number(),
  primary_reason: z.string(),
  etf_return_pct: z.number().nullable(),
  benchmark_return_pct: z.number().nullable(),
  tracking_diff_bps: z.number().nullable(),
  premium_discount_bps: z.number().nullable(),
  spread_bps: z.number().nullable(),
  volume_ratio_20d: z.number().nullable(),
  realized_vol_20d_pct: z.number().nullable(),
  garch_vol_forecast_1d_pct: z.number().nullable(),
  realized_vol_zscore: z.number().nullable(),
  open_ca_count: z.number(),
  pcf_age_days: z.number().nullable(),
  missing_critical_fields: z.number(),
  awaiting_confirmation: z.boolean(),
  updated_at: z.string(),
  evidence_ids: z.array(z.string())
});

export const healthPillarSchema = z.object({
  ticker: z.string(),
  pillar: z.string(),
  label: z.string(),
  status: statusSchema,
  score: z.number(),
  summary: z.string(),
  evidence_ids: z.array(z.string())
});

export const eventSchema = z.object({
  id: z.string(),
  as_of: z.string(),
  event_type: z.string(),
  title: z.string(),
  entity_name: z.string().nullable().optional(),
  entity_id: z.string().nullable().optional(),
  impacted_tickers: z.array(z.string()),
  exposure_pct: z.number().nullable().optional(),
  severity: statusSchema,
  rule_ids: z.array(z.string()),
  suggested_workflow: z.string(),
  ticket_ids: z.array(z.string()),
  evidence_ids: z.array(z.string()),
  source_tag: sourceTagSchema
});

export const ruleBreachSchema = z.object({
  id: z.string(),
  as_of: z.string(),
  ticker: z.string(),
  rule_id: z.string(),
  metric: z.string(),
  metric_value: z.number().nullable(),
  threshold: z.number(),
  severity: statusSchema,
  owner: ownerSchema,
  status: ticketStatusSchema,
  evidence_ids: z.array(z.string())
});

export const ruleDefinitionSchema = z.object({
  id: z.string(),
  label: z.string(),
  description: z.string(),
  metric: z.string(),
  condition: z.string(),
  threshold: z.number(),
  severity: statusSchema,
  owner: ownerSchema,
  suggested_action: z.string()
});

export const ticketSchema = z.object({
  id: z.string(),
  as_of: z.string(),
  ticker: z.string(),
  rule_id: z.string(),
  title: z.string(),
  owner: ownerSchema,
  severity: statusSchema,
  status: ticketStatusSchema,
  due_at: z.string().nullable().optional(),
  suggested_action: z.string(),
  evidence_ids: z.array(z.string())
});

export const evidenceSchema = z.object({
  id: z.string(),
  source_name: z.string(),
  source_tag: sourceTagSchema,
  title: z.string(),
  retrieved_at: z.string(),
  as_of: z.string(),
  url: z.string().nullable().optional(),
  raw_path: z.string().nullable().optional(),
  field_name: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  confidence: z.number().nullable().optional()
});

export const dataSourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.enum(["US", "HK", "CN", "GLOBAL"]),
  source_tag: sourceTagSchema,
  source_type: z.string(),
  license_tag: z.string(),
  production_allowed: z.boolean(),
  redistribution_allowed: z.boolean(),
  last_retrieved_at: z.string(),
  status: z.string(),
  notes: z.string()
});

export const seriesPointSchema = z.object({
  date: z.string(),
  price: z.number().nullable().optional(),
  nav: z.number().nullable().optional(),
  value: z.number().nullable().optional(),
  volume_ratio: z.number().nullable().optional(),
  spread_bps: z.number().nullable().optional()
});

export const tickerTimeSeriesSchema = z.object({
  price_nav: z.array(seriesPointSchema),
  tracking_diff: z.array(seriesPointSchema),
  premium_discount: z.array(seriesPointSchema),
  volume_spread: z.array(seriesPointSchema)
});

export const backtestSchema = z.object({
  ticker: z.string(),
  rule_id: z.string(),
  start_date: z.string(),
  end_date: z.string(),
  trigger_count: z.number(),
  red_count: z.number(),
  yellow_count: z.number(),
  grey_count: z.number(),
  notes: z.string()
});

export const copilotSchema = z.object({
  scope: z.string(),
  ticker: z.string().nullable().optional(),
  label: z.string(),
  summary: z.string(),
  recommended_checks: z.array(z.string()),
  evidence_ids: z.array(z.string()),
  generated_by: z.literal("deterministic_template")
});

export const workflowCheckpointSchema = z.object({
  id: z.string(),
  as_of: z.string(),
  stage: z.string(),
  label: z.string(),
  owner: ownerSchema,
  status: statusSchema,
  due_at: z.string().nullable().optional(),
  summary: z.string(),
  action: z.string(),
  related_ticket_ids: z.array(z.string()),
  related_event_ids: z.array(z.string()),
  evidence_ids: z.array(z.string())
});

export const workflowQueueSchema = z.object({
  owner: ownerSchema,
  open_ticket_count: z.number(),
  red_count: z.number(),
  yellow_count: z.number(),
  grey_count: z.number(),
  next_action: z.string(),
  evidence_ids: z.array(z.string())
});

export const snapshotSchema = z.object({
  as_of: z.string(),
  generated_at: z.string(),
  environment: z.enum(["demo", "internal", "production_placeholder"]),
  data_disclaimer: z.string(),
  source_warnings: z.array(z.string()),
  etfs: z.array(etfSchema),
  metrics: z.array(metricSchema),
  health_pillars: z.array(healthPillarSchema),
  rule_catalog: z.array(ruleDefinitionSchema),
  events: z.array(eventSchema),
  rule_breaches: z.array(ruleBreachSchema),
  tickets: z.array(ticketSchema),
  evidence: z.array(evidenceSchema),
  data_sources: z.array(dataSourceSchema),
  time_series: z.record(z.string(), tickerTimeSeriesSchema),
  backtests: z.array(backtestSchema),
  workflow_checkpoints: z.array(workflowCheckpointSchema),
  workflow_queues: z.array(workflowQueueSchema),
  copilot_summaries: z.array(copilotSchema)
});

export const manifestSchema = z.object({
  latest_as_of: z.string(),
  latest_path: z.string(),
  generated_at: z.string(),
  available_snapshots: z.array(
    z.object({
      as_of: z.string(),
      path: z.string(),
      generated_at: z.string(),
      source_warning_count: z.number(),
      etf_count: z.number(),
      ticket_count: z.number()
    })
  )
});

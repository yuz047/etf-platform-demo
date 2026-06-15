from __future__ import annotations

from enum import Enum
from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator


class Region(str, Enum):
    US = "US"
    HK = "HK"
    CN = "CN"
    GLOBAL = "GLOBAL"


class Status(str, Enum):
    green = "green"
    yellow = "yellow"
    red = "red"
    grey = "grey"
    blue = "blue"


class SourceTag(str, Enum):
    mock_seed = "mock_seed"
    public_official = "public_official"
    open_source_research = "open_source_research"
    licensed_vendor_placeholder = "licensed_vendor_placeholder"
    internal_placeholder = "internal_placeholder"
    unknown_license = "unknown_license"


class WorkflowOwner(str, Enum):
    PM = "PM"
    Ops = "Ops"
    Risk = "Risk"
    Compliance = "Compliance"
    CapitalMarkets = "Capital Markets"
    Data = "Data"


class TicketStatus(str, Enum):
    open = "open"
    reviewing = "reviewing"
    resolved = "resolved"
    waived = "waived"


class ETF(BaseModel):
    ticker: str
    name: str
    region: Literal["US", "HK", "CN"]
    currency: str
    asset_class: str
    benchmark_proxy: str
    aum_millions: float
    expense_ratio_bps: int
    source_tag: SourceTag
    evidence_ids: List[str]


class ETFMetric(BaseModel):
    ticker: str
    as_of: str
    health_status: Status
    health_score: int = Field(ge=0, le=100)
    primary_reason: str
    etf_return_pct: Optional[float]
    benchmark_return_pct: Optional[float]
    tracking_diff_bps: Optional[float]
    premium_discount_bps: Optional[float]
    spread_bps: Optional[float]
    volume_ratio_20d: Optional[float]
    realized_vol_20d_pct: Optional[float]
    realized_vol_zscore: Optional[float]
    open_ca_count: int
    pcf_age_days: Optional[int]
    missing_critical_fields: int
    awaiting_confirmation: bool
    updated_at: str
    evidence_ids: List[str]


class HealthPillar(BaseModel):
    ticker: str
    pillar: str
    label: str
    status: Status
    score: int = Field(ge=0, le=100)
    summary: str
    evidence_ids: List[str]


class EventItem(BaseModel):
    id: str
    as_of: str
    event_type: str
    title: str
    entity_name: Optional[str] = None
    entity_id: Optional[str] = None
    impacted_tickers: List[str]
    exposure_pct: Optional[float] = None
    severity: Status
    rule_ids: List[str]
    suggested_workflow: str
    ticket_ids: List[str]
    evidence_ids: List[str]
    source_tag: SourceTag


class RuleBreach(BaseModel):
    id: str
    as_of: str
    ticker: str
    rule_id: str
    metric: str
    metric_value: Optional[float]
    threshold: float
    severity: Status
    owner: WorkflowOwner
    status: TicketStatus
    evidence_ids: List[str]


class RuleDefinition(BaseModel):
    id: str
    label: str
    description: str
    metric: str
    condition: str
    threshold: float
    severity: Status
    owner: WorkflowOwner
    suggested_action: str


class Ticket(BaseModel):
    id: str
    as_of: str
    ticker: str
    rule_id: str
    title: str
    owner: WorkflowOwner
    severity: Status
    status: TicketStatus
    due_at: Optional[str] = None
    suggested_action: str
    evidence_ids: List[str]


class Evidence(BaseModel):
    id: str
    source_name: str
    source_tag: SourceTag
    title: str
    retrieved_at: str
    as_of: str
    url: Optional[str] = None
    raw_path: Optional[str] = None
    field_name: Optional[str] = None
    value: Optional[str] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)


class DataSource(BaseModel):
    id: str
    name: str
    region: Region
    source_tag: SourceTag
    source_type: str
    license_tag: str
    production_allowed: bool
    redistribution_allowed: bool
    last_retrieved_at: str
    status: str
    notes: str


class SeriesPoint(BaseModel):
    date: str
    price: Optional[float] = None
    nav: Optional[float] = None
    value: Optional[float] = None
    volume_ratio: Optional[float] = None
    spread_bps: Optional[float] = None


class TickerTimeSeries(BaseModel):
    price_nav: List[SeriesPoint]
    tracking_diff: List[SeriesPoint]
    premium_discount: List[SeriesPoint]
    volume_spread: List[SeriesPoint]


class BacktestSummary(BaseModel):
    ticker: str
    rule_id: str
    start_date: str
    end_date: str
    trigger_count: int
    red_count: int
    yellow_count: int
    grey_count: int
    notes: str


class CopilotSummary(BaseModel):
    scope: str
    ticker: Optional[str] = None
    label: str
    summary: str
    recommended_checks: List[str]
    evidence_ids: List[str]
    generated_by: Literal["deterministic_template"]


class WorkflowCheckpoint(BaseModel):
    id: str
    as_of: str
    stage: str
    label: str
    owner: WorkflowOwner
    status: Status
    due_at: Optional[str] = None
    summary: str
    action: str
    related_ticket_ids: List[str]
    related_event_ids: List[str]
    evidence_ids: List[str]


class WorkflowQueue(BaseModel):
    owner: WorkflowOwner
    open_ticket_count: int
    red_count: int
    yellow_count: int
    grey_count: int
    next_action: str
    evidence_ids: List[str]


class Snapshot(BaseModel):
    as_of: str
    generated_at: str
    environment: Literal["demo", "internal", "production_placeholder"]
    data_disclaimer: str
    source_warnings: List[str]
    etfs: List[ETF]
    metrics: List[ETFMetric]
    health_pillars: List[HealthPillar]
    rule_catalog: List[RuleDefinition]
    events: List[EventItem]
    rule_breaches: List[RuleBreach]
    tickets: List[Ticket]
    evidence: List[Evidence]
    data_sources: List[DataSource]
    time_series: Dict[str, TickerTimeSeries]
    backtests: List[BacktestSummary]
    workflow_checkpoints: List[WorkflowCheckpoint]
    workflow_queues: List[WorkflowQueue]
    copilot_summaries: List[CopilotSummary]

    @field_validator("data_disclaimer")
    @classmethod
    def disclaimer_has_required_boundary(cls, value: str) -> str:
        for text in ["Prototype only", "Not investment advice", "Not for trading"]:
            if text not in value:
                raise ValueError(f"Missing disclaimer text: {text}")
        return value


class ManifestSnapshot(BaseModel):
    as_of: str
    path: str
    generated_at: str
    source_warning_count: int
    etf_count: int
    ticket_count: int


class Manifest(BaseModel):
    latest_as_of: str
    latest_path: str
    generated_at: str
    available_snapshots: List[ManifestSnapshot]

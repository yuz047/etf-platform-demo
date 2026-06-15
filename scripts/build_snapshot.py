from __future__ import annotations

import argparse
import json
import math
from datetime import date, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

import pandas as pd
from dateutil import parser as date_parser

try:
    from .build_backtest import build_backtests
    from .ingest_public import load_seed_frames, load_yahoo_test_frames, source_warnings
    from .run_rules import STATUS_RANK, evaluate_rules, health_for_metric, load_rules, make_tickets
    from .schemas import Manifest, Snapshot
except ImportError:
    from build_backtest import build_backtests
    from ingest_public import load_seed_frames, load_yahoo_test_frames, source_warnings
    from run_rules import STATUS_RANK, evaluate_rules, health_for_metric, load_rules, make_tickets
    from schemas import Manifest, Snapshot


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_YAHOO_TEST_TICKERS = [
    "SPY",
    "QQQ",
    "IWM",
    "TLT",
    "GLD",
    "USO",
    "SMH",
    "SOXX",
    "XSD",
    "PSI",
    "SOXQ",
    "XLK",
    "XLE",
    "XLF",
    "XLV",
    "XLY",
    "XLP",
    "XLI",
    "XLB",
    "XLU",
    "XLRE",
    "XLC",
    "XBI",
    "KRE",
    "IWC",
    "MTUM",
    "QUAL",
    "VLUE",
    "USMV",
    "ARKK",
    "ICLN",
    "BOTZ",
    "HACK",
    "IEF",
    "SHY",
]
DISCLAIMER = (
    "Prototype only. Demo/research data may be delayed, incomplete, synthetic, or not licensed "
    "for production use. Not investment advice. Not for trading, regulatory disclosure, client "
    "reporting, redistribution, or NAV/PCF production."
)
PILLARS = [
    ("performance", "Performance"),
    ("tracking", "Tracking"),
    ("premium_discount", "Premium/Discount"),
    ("liquidity", "Liquidity"),
    ("operations", "Operations"),
    ("data_quality", "Data Quality"),
]


def parse_as_of(value: str) -> str:
    if value == "today":
        return date.today().isoformat()
    return date_parser.parse(value).date().isoformat()


def generated_at(as_of: str) -> str:
    return f"{as_of}T22:30:00Z"


def safe_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, float) and math.isnan(value):
        return None
    return float(value)


def percent_return(current: float, prior: float) -> float:
    return round((current / prior - 1) * 100, 4)


def bps(value: float) -> float:
    return round(value * 100, 2)


def build_etfs(frame: pd.DataFrame) -> List[Dict[str, Any]]:
    etfs = []
    for row in frame.to_dict(orient="records"):
        ticker = row["ticker"]
        etfs.append(
            {
                **row,
                "aum_millions": float(row["aum_millions"]),
                "expense_ratio_bps": int(row["expense_ratio_bps"]),
                "evidence_ids": [f"evd_etf_{ticker.lower()}"],
            }
        )
    return etfs


def build_metrics(as_of: str, daily_inputs: pd.DataFrame) -> List[Dict[str, Any]]:
    stamp = generated_at(as_of)
    metrics = []
    for row in daily_inputs.to_dict(orient="records"):
        etf_return = percent_return(row["price"], row["prior_price"])
        benchmark_return = percent_return(row["benchmark"], row["prior_benchmark"])
        spread = ((row["ask"] - row["bid"]) / ((row["ask"] + row["bid"]) / 2)) * 10000
        premium_discount = ((row["price"] - row["nav"]) / row["nav"]) * 10000
        vol_std = row["vol_20d_std_pct"] or 1
        realized_vol_zscore = (row["realized_vol_20d_pct"] - row["vol_20d_mean_pct"]) / vol_std
        metrics.append(
            {
                "ticker": row["ticker"],
                "as_of": as_of,
                "health_status": "green",
                "health_score": 100,
                "primary_reason": "OK",
                "etf_return_pct": etf_return,
                "benchmark_return_pct": benchmark_return,
                "tracking_diff_bps": bps(etf_return - benchmark_return),
                "premium_discount_bps": round(premium_discount, 2),
                "spread_bps": round(spread, 2),
                "volume_ratio_20d": round(row["volume"] / row["avg_volume_20d"], 3),
                "realized_vol_20d_pct": round(row["realized_vol_20d_pct"], 2),
                "realized_vol_zscore": round(realized_vol_zscore, 2),
                "open_ca_count": int(row["open_ca_count"]),
                "pcf_age_days": int(row["pcf_age_days"]),
                "missing_critical_fields": int(row["missing_critical_fields"]),
                "awaiting_confirmation": str(row["awaiting_confirmation"]).lower() == "true",
                "updated_at": stamp,
                "evidence_ids": [f"evd_metric_{row['ticker'].lower()}"],
            }
        )
    return metrics


def build_events(as_of: str, events_frame: pd.DataFrame) -> List[Dict[str, Any]]:
    events = []
    for row in events_frame.to_dict(orient="records"):
        impacted = [item.strip() for item in str(row["impacted_tickers"]).split("|") if item.strip()]
        rule_ids = [item.strip() for item in str(row["rule_ids"]).split("|") if item.strip()]
        exposure = None if row["exposure_pct"] == "" else float(row["exposure_pct"])
        events.append(
            {
                "id": row["id"],
                "as_of": as_of,
                "event_type": row["event_type"],
                "title": row["title"],
                "entity_name": row["entity_name"] or None,
                "entity_id": row["entity_id"] or None,
                "impacted_tickers": impacted,
                "exposure_pct": exposure,
                "severity": row["severity"],
                "rule_ids": rule_ids,
                "suggested_workflow": row["suggested_workflow"],
                "ticket_ids": [],
                "evidence_ids": [row["evidence_id"]],
                "source_tag": row["source_tag"],
            }
        )
    return events


def attach_health(metrics: List[Dict[str, Any]], breaches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output = []
    for metric in metrics:
        status, score, reason = health_for_metric(metric, breaches)
        output.append({**metric, "health_status": status, "health_score": score, "primary_reason": reason})
    return output


def attach_event_tickets(events: List[Dict[str, Any]], tickets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output = []
    for event in events:
        ticket_ids = [
            ticket["id"]
            for ticket in tickets
            if ticket["ticker"] in event["impacted_tickers"] and ticket["rule_id"] in event["rule_ids"]
        ]
        output.append({**event, "ticket_ids": ticket_ids})
    return output


def pillar_for_rule(rule_id: str) -> str:
    if "TRACKING" in rule_id:
        return "tracking"
    if "PREMIUM" in rule_id:
        return "premium_discount"
    if "SPREAD" in rule_id or "VOLUME" in rule_id:
        return "liquidity"
    if "VOLATILITY" in rule_id:
        return "performance"
    if "CORPORATE" in rule_id or "PCF" in rule_id:
        return "operations"
    if "DATA_QUALITY" in rule_id:
        return "data_quality"
    return "performance"


def build_health_pillars(metrics: List[Dict[str, Any]], breaches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output = []
    for metric in metrics:
        ticker_breaches = [breach for breach in breaches if breach["ticker"] == metric["ticker"]]
        for pillar_id, label in PILLARS:
            relevant = [breach for breach in ticker_breaches if pillar_for_rule(breach["rule_id"]) == pillar_id]
            status = "green"
            score = 100
            summary = f"{label} checks are within demo threshold."
            evidence_ids = metric["evidence_ids"]
            if relevant:
                top = sorted(relevant, key=lambda item: STATUS_RANK[item["severity"]], reverse=True)[0]
                status = top["severity"]
                score = {"red": 55, "grey": 60, "yellow": 74, "blue": 84, "green": 100}[status]
                summary = f"{label} triggered {top['rule_id']}."
                evidence_ids = top["evidence_ids"]
            output.append(
                {
                    "ticker": metric["ticker"],
                    "pillar": pillar_id,
                    "label": label,
                    "status": status,
                    "score": score,
                    "summary": summary,
                    "evidence_ids": evidence_ids,
                }
            )
    return output


def build_evidence(
    as_of: str,
    etfs: List[Dict[str, Any]],
    metrics: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    source: str = "seed",
) -> List[Dict[str, Any]]:
    stamp = generated_at(as_of)
    etf_source_name = "Yahoo Finance via yfinance" if source == "yahoo_test" else "Seed ETF universe"
    metric_source_name = "Yahoo Finance via yfinance" if source == "yahoo_test" else "Seed daily metric input"
    etf_raw_path = None if source == "yahoo_test" else "data/seed/etfs.csv"
    metric_raw_path = None if source == "yahoo_test" else "data/seed/daily_inputs.csv"
    etf_title_suffix = "Yahoo test ETF profile" if source == "yahoo_test" else "seed ETF profile"
    evidence = []
    for etf in etfs:
        evidence.append(
            {
                "id": etf["evidence_ids"][0],
                "source_name": etf_source_name,
                "source_tag": etf["source_tag"],
                "title": f"{etf['ticker']} {etf_title_suffix}",
                "retrieved_at": stamp,
                "as_of": as_of,
                "url": f"https://finance.yahoo.com/quote/{etf['ticker']}" if source == "yahoo_test" else None,
                "raw_path": etf_raw_path,
                "field_name": "ticker",
                "value": etf["ticker"],
                "confidence": 0.5,
            }
        )
    for metric in metrics:
        evidence.append(
            {
                "id": metric["evidence_ids"][0],
                "source_name": metric_source_name,
                "source_tag": "unknown_license" if source == "yahoo_test" else "mock_seed",
                "title": f"{metric['ticker']} calculated metric row",
                "retrieved_at": stamp,
                "as_of": as_of,
                "url": f"https://finance.yahoo.com/quote/{metric['ticker']}" if source == "yahoo_test" else None,
                "raw_path": metric_raw_path,
                "field_name": "primary_reason",
                "value": metric["primary_reason"],
                "confidence": 0.5,
            }
        )
    for event in events:
        evidence.append(
            {
                "id": event["evidence_ids"][0],
                "source_name": "Yahoo Finance via yfinance" if source == "yahoo_test" else "Seed event fixture",
                "source_tag": event["source_tag"],
                "title": event["title"],
                "retrieved_at": stamp,
                "as_of": as_of,
                "url": None,
                "raw_path": "data/seed/events.csv",
                "field_name": "event_type",
                "value": event["event_type"],
                "confidence": 0.5,
            }
        )
    return evidence


def build_data_sources(as_of: str) -> List[Dict[str, Any]]:
    stamp = generated_at(as_of)
    return [
        {
            "id": "src_seed",
            "name": "Seed data",
            "region": "GLOBAL",
            "source_tag": "mock_seed",
            "source_type": "mock_seed",
            "license_tag": "public_demo_seed",
            "production_allowed": False,
            "redistribution_allowed": True,
            "last_retrieved_at": stamp,
            "status": "ok",
            "notes": "Synthetic data for prototype only.",
        },
        {
            "id": "src_public_research_placeholder",
            "name": "Open-source research placeholder",
            "region": "GLOBAL",
            "source_tag": "open_source_research",
            "source_type": "open_source_research",
            "license_tag": "placeholder_research_only",
            "production_allowed": False,
            "redistribution_allowed": False,
            "last_retrieved_at": stamp,
            "status": "placeholder",
            "notes": "No live feed is called in this public demo.",
        },
        {
            "id": "src_vendor_placeholder",
            "name": "Licensed vendor placeholder",
            "region": "GLOBAL",
            "source_tag": "licensed_vendor_placeholder",
            "source_type": "licensed_vendor_placeholder",
            "license_tag": "placeholder_no_real_vendor_data",
            "production_allowed": False,
            "redistribution_allowed": False,
            "last_retrieved_at": stamp,
            "status": "blocked",
            "notes": "Placeholder only; no licensed vendor rows are included.",
        },
    ]


def build_yahoo_test_data_sources(as_of: str) -> List[Dict[str, Any]]:
    stamp = generated_at(as_of)
    return [
        {
            "id": "src_yahoo_finance_test",
            "name": "Yahoo Finance test feed via yfinance",
            "region": "US",
            "source_tag": "unknown_license",
            "source_type": "yahoo_finance_test",
            "license_tag": "Yahoo Finance via yfinance; test only; no redistribution assumed",
            "production_allowed": False,
            "redistribution_allowed": False,
            "last_retrieved_at": stamp,
            "status": "test_only",
            "notes": "Source: Yahoo Finance via yfinance. yfinance is not affiliated with Yahoo. Yahoo Finance data rights must be checked before any production, public, or redistributed use.",
        }
    ]


def normalize_history(history: pd.DataFrame) -> pd.DataFrame:
    frame = history.reset_index()
    date_column = "Date" if "Date" in frame.columns else frame.columns[0]
    frame["date"] = pd.to_datetime(frame[date_column]).dt.date.astype(str)
    return frame.dropna(subset=["Close"]).sort_values("date")


def build_yahoo_time_series(
    histories: Dict[str, pd.DataFrame],
    metrics: List[Dict[str, Any]],
    benchmark: str,
) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    benchmark_frame = normalize_history(histories[benchmark])
    benchmark_frame["benchmark_return"] = benchmark_frame["Close"].pct_change()
    benchmark_returns = benchmark_frame[["date", "benchmark_return"]]
    series: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}

    for metric in metrics:
        ticker = metric["ticker"]
        frame = normalize_history(histories[ticker])
        frame["etf_return"] = frame["Close"].pct_change()
        frame["avg_volume"] = frame["Volume"].rolling(window=20, min_periods=1).mean()
        frame = frame.merge(benchmark_returns, on="date", how="left")

        premium_discount_bps = metric["premium_discount_bps"] or 0
        nav_multiplier = 1 + premium_discount_bps / 10000
        if nav_multiplier == 0:
            nav_multiplier = 1
        spread_bps = metric["spread_bps"] or 0

        price_nav = []
        tracking = []
        premium = []
        volume_spread = []
        for row in frame.to_dict(orient="records"):
            close = float(row["Close"])
            date_value = row["date"]
            price_nav.append({"date": date_value, "price": round(close, 2), "nav": round(close / nav_multiplier, 2)})
            premium.append({"date": date_value, "value": round(premium_discount_bps, 2)})

            etf_return = row.get("etf_return")
            benchmark_return = row.get("benchmark_return")
            if not pd.isna(etf_return) and not pd.isna(benchmark_return):
                tracking.append({"date": date_value, "value": round((etf_return - benchmark_return) * 10000, 2)})

            volume = row.get("Volume")
            avg_volume = row.get("avg_volume")
            volume_ratio = None if pd.isna(volume) or pd.isna(avg_volume) or not avg_volume else float(volume) / float(avg_volume)
            volume_spread.append(
                {
                    "date": date_value,
                    "volume_ratio": round(volume_ratio, 2) if volume_ratio is not None else None,
                    "spread_bps": round(spread_bps, 2),
                }
            )

        series[ticker] = {
            "price_nav": price_nav,
            "tracking_diff": tracking,
            "premium_discount": premium,
            "volume_spread": volume_spread,
        }
    return series


def build_time_series(as_of: str, metrics: List[Dict[str, Any]]) -> Dict[str, Dict[str, List[Dict[str, Any]]]]:
    end = date.fromisoformat(as_of)
    series: Dict[str, Dict[str, List[Dict[str, Any]]]] = {}
    for index, metric in enumerate(metrics):
        base = 80 + index * 3
        price_nav = []
        tracking = []
        premium = []
        volume_spread = []
        for offset in range(15):
            day = end - timedelta(days=14 - offset)
            drift = (offset - 7) * 0.14
            tracking_value = (metric["tracking_diff_bps"] or 0) * (0.45 + offset / 30)
            premium_value = (metric["premium_discount_bps"] or 0) * (0.35 + offset / 24)
            spread_value = (metric["spread_bps"] or 0) * (0.7 + offset / 40)
            price_nav.append(
                {
                    "date": day.isoformat(),
                    "price": round(base + drift + premium_value / 120, 2),
                    "nav": round(base + drift, 2),
                }
            )
            tracking.append({"date": day.isoformat(), "value": round(tracking_value, 2)})
            premium.append({"date": day.isoformat(), "value": round(premium_value, 2)})
            volume_spread.append(
                {
                    "date": day.isoformat(),
                    "volume_ratio": round((metric["volume_ratio_20d"] or 0.5) * (0.82 + offset / 70), 2),
                    "spread_bps": round(spread_value, 2),
                }
            )
        series[metric["ticker"]] = {
            "price_nav": price_nav,
            "tracking_diff": tracking,
            "premium_discount": premium,
            "volume_spread": volume_spread,
        }
    return series


def unique_values(values: List[str]) -> List[str]:
    output = []
    for value in values:
        if value and value not in output:
            output.append(value)
    return output


def status_from_tickets(tickets: List[Dict[str, Any]]) -> str:
    if any(ticket["severity"] == "red" for ticket in tickets):
        return "red"
    if any(ticket["severity"] == "yellow" for ticket in tickets):
        return "yellow"
    if any(ticket["severity"] == "grey" for ticket in tickets):
        return "grey"
    return "green"


def build_workflow_queues(tickets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    owners = ["PM", "Capital Markets", "Risk", "Ops", "Data", "Compliance"]
    output = []
    for owner in owners:
        owner_tickets = [ticket for ticket in tickets if ticket["owner"] == owner]
        sorted_tickets = sorted(owner_tickets, key=lambda item: STATUS_RANK[item["severity"]], reverse=True)
        next_action = sorted_tickets[0]["suggested_action"] if sorted_tickets else "No open workflow tickets."
        output.append(
            {
                "owner": owner,
                "open_ticket_count": len(owner_tickets),
                "red_count": sum(1 for ticket in owner_tickets if ticket["severity"] == "red"),
                "yellow_count": sum(1 for ticket in owner_tickets if ticket["severity"] == "yellow"),
                "grey_count": sum(1 for ticket in owner_tickets if ticket["severity"] == "grey"),
                "next_action": next_action,
                "evidence_ids": unique_values(
                    [evidence_id for ticket in sorted_tickets[:5] for evidence_id in ticket["evidence_ids"]]
                ),
            }
        )
    return output


def build_workflow_checkpoints(
    as_of: str,
    metrics: List[Dict[str, Any]],
    tickets: List[Dict[str, Any]],
    events: List[Dict[str, Any]],
    source_warnings: List[str],
) -> List[Dict[str, Any]]:
    red_tickets = [ticket for ticket in tickets if ticket["severity"] == "red"]
    capital_markets_tickets = [ticket for ticket in tickets if ticket["owner"] == "Capital Markets"]
    missing_metrics = [metric for metric in metrics if metric["missing_critical_fields"] > 0]
    all_ticket_evidence = unique_values([evidence_id for ticket in tickets for evidence_id in ticket["evidence_ids"]])
    event_ids = [event["id"] for event in events]
    event_evidence = unique_values([evidence_id for event in events for evidence_id in event["evidence_ids"]])
    top_tickets = sorted(tickets, key=lambda item: STATUS_RANK[item["severity"]], reverse=True)
    top_ticket_ids = [ticket["id"] for ticket in top_tickets[:8]]
    top_evidence = unique_values([evidence_id for ticket in top_tickets[:5] for evidence_id in ticket["evidence_ids"]])

    return [
        {
            "id": "wf_source_refresh",
            "as_of": as_of,
            "stage": "source_refresh",
            "label": "Source refresh and rights check",
            "owner": "Data",
            "status": "grey" if source_warnings else "green",
            "due_at": f"{as_of}T08:30:00Z",
            "summary": f"{len(source_warnings)} source warnings require operator acknowledgement.",
            "action": "Confirm source freshness, Yahoo/yfinance usage boundary, and redistribution limits before publishing.",
            "related_ticket_ids": [],
            "related_event_ids": event_ids,
            "evidence_ids": event_evidence,
        },
        {
            "id": "wf_exception_triage",
            "as_of": as_of,
            "stage": "exception_triage",
            "label": "Rule exception triage",
            "owner": "PM",
            "status": status_from_tickets(tickets),
            "due_at": f"{as_of}T10:30:00Z",
            "summary": f"{len(tickets)} open workflow tickets across {len(metrics)} monitored ETFs.",
            "action": "Review red tickets first, then assign yellow tickets to owner queues with evidence IDs attached.",
            "related_ticket_ids": top_ticket_ids,
            "related_event_ids": [],
            "evidence_ids": top_evidence,
        },
        {
            "id": "wf_liquidity_review",
            "as_of": as_of,
            "stage": "liquidity_review",
            "label": "Capital markets liquidity review",
            "owner": "Capital Markets",
            "status": status_from_tickets(capital_markets_tickets),
            "due_at": f"{as_of}T12:00:00Z",
            "summary": f"{len(capital_markets_tickets)} spread, premium/discount, or volume tickets need market-quality review.",
            "action": "Review quote quality, secondary-market volume, and proxy premium/discount context.",
            "related_ticket_ids": [ticket["id"] for ticket in capital_markets_tickets[:8]],
            "related_event_ids": [],
            "evidence_ids": unique_values(
                [evidence_id for ticket in capital_markets_tickets[:5] for evidence_id in ticket["evidence_ids"]]
            ),
        },
        {
            "id": "wf_data_quality",
            "as_of": as_of,
            "stage": "data_quality",
            "label": "Data quality attestation",
            "owner": "Data",
            "status": "grey" if missing_metrics or source_warnings else "green",
            "due_at": f"{as_of}T14:30:00Z",
            "summary": f"{len(missing_metrics)} ETFs have missing critical fields; {len(source_warnings)} source warnings remain visible.",
            "action": "Use the Data Quality page to confirm missing fields, stale fields, source tags, and evidence coverage.",
            "related_ticket_ids": [],
            "related_event_ids": event_ids,
            "evidence_ids": event_evidence,
        },
        {
            "id": "wf_evidence_pack",
            "as_of": as_of,
            "stage": "evidence_pack",
            "label": "Evidence pack completeness",
            "owner": "Compliance",
            "status": "green" if all(ticket["evidence_ids"] for ticket in tickets) else "grey",
            "due_at": f"{as_of}T16:00:00Z",
            "summary": f"{len(all_ticket_evidence)} unique evidence IDs support open tickets.",
            "action": "Confirm every ticket, event, and workflow claim links back to evidence before handoff.",
            "related_ticket_ids": top_ticket_ids,
            "related_event_ids": event_ids,
            "evidence_ids": unique_values(all_ticket_evidence + event_evidence),
        },
        {
            "id": "wf_publish_readiness",
            "as_of": as_of,
            "stage": "publish_readiness",
            "label": "Operational publish readiness",
            "owner": "Ops",
            "status": "red" if red_tickets else "yellow" if tickets or source_warnings else "green",
            "due_at": f"{as_of}T17:30:00Z",
            "summary": f"{len(red_tickets)} red tickets and {len(tickets)} total tickets before close-of-day handoff.",
            "action": "Hold operational sign-off until red tickets have owner review and evidence-backed next steps.",
            "related_ticket_ids": top_ticket_ids,
            "related_event_ids": event_ids,
            "evidence_ids": unique_values(top_evidence + event_evidence),
        },
    ]


def build_copilot(as_of: str, metrics: List[Dict[str, Any]], tickets: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    counts = {status: sum(1 for metric in metrics if metric["health_status"] == status) for status in STATUS_RANK}
    top_ticket = sorted(tickets, key=lambda item: STATUS_RANK[item["severity"]], reverse=True)[0] if tickets else None
    if top_ticket:
        summary = (
            f"As of {as_of}, ETF Tower monitors {len(metrics)} ETFs. {counts['red']} are red, "
            f"{counts['yellow']} are yellow, and {len(tickets)} tickets are open. The highest-priority "
            f"issue is {top_ticket['rule_id']} affecting {top_ticket['ticker']}. Suggested next check: "
            f"{top_ticket['suggested_action']} Evidence: {', '.join(top_ticket['evidence_ids'])}."
        )
        checks = [top_ticket["suggested_action"]]
        evidence_ids = top_ticket["evidence_ids"]
    else:
        summary = f"As of {as_of}, ETF Tower monitors {len(metrics)} ETFs with no open rule tickets."
        checks = ["Review source warnings and confirm the snapshot generated successfully."]
        evidence_ids = []
    return [
        {
            "scope": "daily",
            "ticker": None,
            "label": "Internal draft · evidence-based · prototype only",
            "summary": summary,
            "recommended_checks": checks,
            "evidence_ids": evidence_ids,
            "generated_by": "deterministic_template",
        }
    ]


def build_snapshot(
    as_of: str,
    source: str = "seed",
    tickers: Optional[List[str]] = None,
    benchmark: str = "SPY",
) -> Dict[str, Any]:
    if source == "yahoo_test":
        frames = load_yahoo_test_frames(tickers or DEFAULT_YAHOO_TEST_TICKERS, benchmark)
    elif source == "seed":
        frames = load_seed_frames()
    else:
        raise ValueError(f"Unsupported snapshot source: {source}")

    etfs = build_etfs(frames["etfs"])
    metrics = build_metrics(as_of, frames["daily_inputs"])
    events = build_events(as_of, frames["events"])
    rules = load_rules()
    preliminary_breaches = evaluate_rules(as_of, metrics, rules)
    metrics = attach_health(metrics, preliminary_breaches)
    breaches = evaluate_rules(as_of, metrics, rules)
    tickets = make_tickets(as_of, breaches, rules)
    events = attach_event_tickets(events, tickets)
    time_series = (
        build_yahoo_time_series(frames["histories"], metrics, benchmark)
        if source == "yahoo_test" and "histories" in frames
        else build_time_series(as_of, metrics)
    )
    warnings = source_warnings(source)
    workflow_checkpoints = build_workflow_checkpoints(as_of, metrics, tickets, events, warnings)
    workflow_queues = build_workflow_queues(tickets)
    snapshot = {
        "as_of": as_of,
        "generated_at": generated_at(as_of),
        "environment": "demo",
        "data_disclaimer": DISCLAIMER,
        "source_warnings": warnings,
        "etfs": etfs,
        "metrics": metrics,
        "health_pillars": build_health_pillars(metrics, breaches),
        "rule_catalog": [rule.__dict__ for rule in rules],
        "events": events,
        "rule_breaches": breaches,
        "tickets": tickets,
        "evidence": build_evidence(as_of, etfs, metrics, events, source),
        "data_sources": build_yahoo_test_data_sources(as_of) if source == "yahoo_test" else build_data_sources(as_of),
        "time_series": time_series,
        "backtests": build_backtests(as_of, metrics, breaches),
        "workflow_checkpoints": workflow_checkpoints,
        "workflow_queues": workflow_queues,
        "copilot_summaries": build_copilot(as_of, metrics, tickets),
    }
    return Snapshot.model_validate(snapshot).model_dump(mode="json")


def write_outputs(snapshot: Dict[str, Any], output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    snapshots_dir = output_dir / "snapshots"
    snapshots_dir.mkdir(parents=True, exist_ok=True)
    as_of = snapshot["as_of"]
    (output_dir / "latest.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    (snapshots_dir / f"{as_of}.json").write_text(json.dumps(snapshot, indent=2) + "\n", encoding="utf-8")
    manifest = {
        "latest_as_of": as_of,
        "latest_path": "/data/latest.json",
        "generated_at": snapshot["generated_at"],
        "available_snapshots": [
            {
                "as_of": as_of,
                "path": f"/data/snapshots/{as_of}.json",
                "generated_at": snapshot["generated_at"],
                "source_warning_count": len(snapshot["source_warnings"]),
                "etf_count": len(snapshot["etfs"]),
                "ticket_count": len(snapshot["tickets"]),
            }
        ],
    }
    Manifest.model_validate(manifest)
    (output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--as-of", default="today")
    parser.add_argument("--output", default="public/data")
    parser.add_argument("--source", choices=["seed", "yahoo_test"], default="seed")
    parser.add_argument("--tickers", nargs="+", default=DEFAULT_YAHOO_TEST_TICKERS)
    parser.add_argument("--benchmark", default="SPY")
    args = parser.parse_args()
    output_dir = Path(args.output)
    if not output_dir.is_absolute():
        output_dir = ROOT / output_dir
    write_outputs(
        build_snapshot(parse_as_of(args.as_of), source=args.source, tickers=args.tickers, benchmark=args.benchmark),
        output_dir,
    )


if __name__ == "__main__":
    main()

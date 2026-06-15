from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import yaml


ROOT = Path(__file__).resolve().parents[1]
STATUS_RANK = {"green": 0, "blue": 1, "yellow": 2, "grey": 3, "red": 4}
SCORE_PENALTY = {"red": 30, "grey": 20, "yellow": 12, "blue": 8, "green": 0}


@dataclass(frozen=True)
class Rule:
    id: str
    label: str
    description: str
    metric: str
    condition: str
    threshold: float
    severity: str
    owner: str
    suggested_action: str


def load_rules(path: Optional[Path] = None) -> List[Rule]:
    rule_path = path or ROOT / "rules" / "rules.yml"
    with rule_path.open("r", encoding="utf-8") as file:
        payload = yaml.safe_load(file)
    return [Rule(**item) for item in payload["rules"]]


def condition_matches(value: Optional[float], condition: str, threshold: float) -> bool:
    if value is None:
        return False
    if condition == "abs(value) > threshold":
        return abs(float(value)) > threshold
    if condition == "value > threshold":
        return float(value) > threshold
    if condition == "value < threshold":
        return float(value) < threshold
    raise ValueError(f"Unsupported condition: {condition}")


def stable_id(prefix: str, *parts: str) -> str:
    digest = hashlib.sha1(":".join(parts).encode("utf-8")).hexdigest()[:10]
    return f"{prefix}_{digest}"


def evaluate_rules(as_of: str, metrics: List[Dict[str, Any]], rules: List[Rule]) -> List[Dict[str, Any]]:
    breaches: List[Dict[str, Any]] = []
    for metric in metrics:
        for rule in rules:
            value = metric.get(rule.metric)
            if not condition_matches(value, rule.condition, rule.threshold):
                continue
            breaches.append(
                {
                    "id": stable_id("br", as_of, metric["ticker"], rule.id),
                    "as_of": as_of,
                    "ticker": metric["ticker"],
                    "rule_id": rule.id,
                    "metric": rule.metric,
                    "metric_value": value,
                    "threshold": rule.threshold,
                    "severity": rule.severity,
                    "owner": rule.owner,
                    "status": "open",
                    "evidence_ids": metric["evidence_ids"],
                }
            )
    return breaches


def health_for_metric(metric: Dict[str, Any], breaches: List[Dict[str, Any]]) -> Tuple[str, int, str]:
    ticker_breaches = [breach for breach in breaches if breach["ticker"] == metric["ticker"]]
    status = "green"
    score = 100
    reason = "OK"

    if metric.get("awaiting_confirmation"):
        status = "blue"
        score -= SCORE_PENALTY["blue"]
        reason = "AWAITING_EXTERNAL_CONFIRMATION"

    for breach in sorted(ticker_breaches, key=lambda item: STATUS_RANK[item["severity"]], reverse=True):
        severity = breach["severity"]
        score -= SCORE_PENALTY[severity]
        if STATUS_RANK[severity] > STATUS_RANK[status]:
            status = severity
            reason = breach["rule_id"]

    return status, max(0, min(100, score)), reason


def make_tickets(as_of: str, breaches: List[Dict[str, Any]], rules: List[Rule]) -> List[Dict[str, Any]]:
    rules_by_id = {rule.id: rule for rule in rules}
    due_at = (
        datetime.fromisoformat(f"{as_of}T00:00:00+00:00") + timedelta(hours=23, minutes=30)
    ).astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    tickets = []
    seen = set()
    for breach in breaches:
        key = (as_of, breach["ticker"], breach["rule_id"])
        if key in seen:
            continue
        seen.add(key)
        rule = rules_by_id[breach["rule_id"]]
        tickets.append(
            {
                "id": stable_id("tkt", *key),
                "as_of": as_of,
                "ticker": breach["ticker"],
                "rule_id": breach["rule_id"],
                "title": f"{rule.label} for {breach['ticker']}",
                "owner": rule.owner,
                "severity": rule.severity,
                "status": "open",
                "due_at": due_at,
                "suggested_action": rule.suggested_action,
                "evidence_ids": breach["evidence_ids"],
            }
        )
    return tickets

from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Dict, List, Tuple


def build_backtests(as_of: str, metrics: List[Dict[str, Any]], breaches: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    end = date.fromisoformat(as_of)
    start = end - timedelta(days=44)
    breach_map: Dict[Tuple[str, str], Dict[str, Any]] = {
        (breach["ticker"], breach["rule_id"]): breach for breach in breaches
    }
    output = []
    for metric in metrics:
        pairs = [pair for pair in breach_map if pair[0] == metric["ticker"]] or [(metric["ticker"], "DAILY_HEALTH_REPLAY")]
        for ticker, rule_id in pairs:
            severity = breach_map.get((ticker, rule_id), {}).get("severity", "green")
            triggers = {"red": 5, "grey": 4, "yellow": 3, "blue": 1, "green": 0}[severity]
            output.append(
                {
                    "ticker": ticker,
                    "rule_id": rule_id,
                    "start_date": start.isoformat(),
                    "end_date": as_of,
                    "trigger_count": triggers,
                    "red_count": triggers if severity == "red" else 0,
                    "yellow_count": triggers if severity == "yellow" else 0,
                    "grey_count": triggers if severity == "grey" else 0,
                    "notes": "Deterministic snapshot replay for workflow threshold calibration.",
                }
            )
    return output

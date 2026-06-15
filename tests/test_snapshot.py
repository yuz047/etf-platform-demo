from __future__ import annotations

import json

import pandas as pd

import scripts.build_snapshot as build_snapshot_module
from scripts.build_snapshot import build_metrics, build_snapshot, write_outputs
from scripts.ingest_public import garch_11_forecast_vol_pct, load_seed_frames
from scripts.run_rules import condition_matches, load_rules, make_tickets
from scripts.schemas import Snapshot


def test_metric_formulas() -> None:
    metrics = build_metrics("2026-06-14", load_seed_frames()["daily_inputs"])
    us_demo_1 = next(metric for metric in metrics if metric["ticker"] == "US_DEMO_1")
    assert us_demo_1["etf_return_pct"] == 0.18
    assert us_demo_1["benchmark_return_pct"] == 0.11
    assert us_demo_1["tracking_diff_bps"] == 7.0


def test_rule_trigger_logic() -> None:
    assert condition_matches(82, "abs(value) > threshold", 75)
    assert condition_matches(0.42, "value < threshold", 0.5)
    assert not condition_matches(None, "value > threshold", 0)


def test_garch_forecast_responds_to_recent_volatility() -> None:
    calm = pd.Series([0.001, -0.001] * 80)
    stressed = pd.Series(([0.001, -0.001] * 60) + ([0.04, -0.035] * 20))
    assert garch_11_forecast_vol_pct(stressed) > garch_11_forecast_vol_pct(calm)


def test_snapshot_schema_and_health_examples() -> None:
    snapshot = build_snapshot("2026-06-14")
    Snapshot.model_validate(snapshot)
    statuses = {metric["health_status"] for metric in snapshot["metrics"]}
    assert {"red", "yellow", "green"}.issubset(statuses)
    assert snapshot["events"]
    assert snapshot["rule_breaches"]
    assert all(ticket["evidence_ids"] for ticket in snapshot["tickets"])


def test_idempotent_ticket_generation() -> None:
    snapshot = build_snapshot("2026-06-14")
    rules = load_rules()
    tickets_a = make_tickets("2026-06-14", snapshot["rule_breaches"], rules)
    tickets_b = make_tickets("2026-06-14", snapshot["rule_breaches"], rules)
    assert [ticket["id"] for ticket in tickets_a] == [ticket["id"] for ticket in tickets_b]


def test_snapshot_writing(tmp_path) -> None:
    snapshot = build_snapshot("2026-06-14")
    write_outputs(snapshot, tmp_path)
    latest = json.loads((tmp_path / "latest.json").read_text())
    manifest = json.loads((tmp_path / "manifest.json").read_text())
    assert latest["as_of"] == "2026-06-14"
    assert manifest["latest_path"] == "/data/latest.json"
    assert (tmp_path / "snapshots" / "2026-06-14.json").exists()


def test_yahoo_test_source_uses_explicit_test_metadata(monkeypatch) -> None:
    def fake_yahoo_frames(tickers, benchmark):
        assert tickers == ["SPY", "QQQ"]
        assert benchmark == "SPY"
        return {
            "etfs": pd.DataFrame(
                [
                    {
                        "ticker": "SPY",
                        "name": "SPY Yahoo Finance test ETF",
                        "region": "US",
                        "currency": "USD",
                        "asset_class": "equity",
                        "benchmark_proxy": "SPY",
                        "aum_millions": 0.0,
                        "expense_ratio_bps": 0,
                        "source_tag": "unknown_license",
                    },
                    {
                        "ticker": "QQQ",
                        "name": "QQQ Yahoo Finance test ETF",
                        "region": "US",
                        "currency": "USD",
                        "asset_class": "equity",
                        "benchmark_proxy": "SPY",
                        "aum_millions": 0.0,
                        "expense_ratio_bps": 0,
                        "source_tag": "unknown_license",
                    },
                ]
            ),
            "daily_inputs": pd.DataFrame(
                [
                    {
                        "ticker": "SPY",
                        "prior_price": 100.0,
                        "price": 101.0,
                        "prior_nav": 100.0,
                        "nav": 101.0,
                        "prior_benchmark": 100.0,
                        "benchmark": 101.0,
                        "bid": 100.9,
                        "ask": 101.1,
                        "volume": 1000,
                        "avg_volume_20d": 1000,
                        "realized_vol_20d_pct": 10.0,
                        "vol_20d_mean_pct": 10.0,
                        "vol_20d_std_pct": 1.0,
                        "open_ca_count": 0,
                        "pcf_age_days": 0,
                        "missing_critical_fields": 2,
                        "awaiting_confirmation": False,
                    },
                    {
                        "ticker": "QQQ",
                        "prior_price": 200.0,
                        "price": 202.0,
                        "prior_nav": 200.0,
                        "nav": 202.0,
                        "prior_benchmark": 100.0,
                        "benchmark": 101.0,
                        "bid": 201.7,
                        "ask": 202.3,
                        "volume": 2000,
                        "avg_volume_20d": 2500,
                        "realized_vol_20d_pct": 12.0,
                        "vol_20d_mean_pct": 12.0,
                        "vol_20d_std_pct": 1.0,
                        "open_ca_count": 0,
                        "pcf_age_days": 0,
                        "missing_critical_fields": 2,
                        "awaiting_confirmation": False,
                    },
                ]
            ),
            "events": pd.DataFrame(
                [
                    {
                        "id": "evt_yahoo_test_limitations",
                        "event_type": "data_quality",
                        "title": "Yahoo Finance test feed uses close/ohlc proxies only",
                        "entity_name": "Yahoo Finance via yfinance",
                        "entity_id": "YAHOO_FINANCE_TEST",
                        "impacted_tickers": "SPY|QQQ",
                        "exposure_pct": "",
                        "severity": "grey",
                        "rule_ids": "DATA_QUALITY_GAP",
                        "suggested_workflow": "Use this feed only for local testing.",
                        "evidence_id": "evd_yahoo_test_limitations",
                        "source_tag": "unknown_license",
                    }
                ]
            ),
        }

    monkeypatch.setattr(build_snapshot_module, "load_yahoo_test_frames", fake_yahoo_frames)
    snapshot = build_snapshot("2026-06-14", source="yahoo_test", tickers=["SPY", "QQQ"], benchmark="SPY")
    Snapshot.model_validate(snapshot)
    assert [etf["ticker"] for etf in snapshot["etfs"]] == ["SPY", "QQQ"]
    assert snapshot["data_sources"][0]["source_type"] == "yahoo_finance_test"
    assert snapshot["data_sources"][0]["redistribution_allowed"] is False
    assert all(etf["source_tag"] == "unknown_license" for etf in snapshot["etfs"])
    assert any("Yahoo Finance test feed" in warning for warning in snapshot["source_warnings"])

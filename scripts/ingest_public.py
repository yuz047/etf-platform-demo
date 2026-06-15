from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Iterable

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SEED_DIR = ROOT / "data" / "seed"
SEMICONDUCTOR_ETFS = {"SMH", "SOXX", "XSD", "PSI", "SOXQ"}


def yahoo_metadata(quote: Any, ticker: str) -> Dict[str, Any]:
    try:
        info = quote.get_info()
    except Exception:
        info = {}
    total_assets = info.get("totalAssets")
    expense_ratio = info.get("annualReportExpenseRatio") or info.get("expenseRatio")
    return {
        "name": info.get("longName") or info.get("shortName") or f"{ticker} ETF",
        "aum_millions": round(float(total_assets) / 1_000_000, 1) if total_assets else 0.0,
        "expense_ratio_bps": round(float(expense_ratio) * 10000) if expense_ratio else 0,
        "asset_class": "semiconductor equity" if ticker in SEMICONDUCTOR_ETFS else "equity",
        "nav": info.get("navPrice"),
        "bid": info.get("bid"),
        "ask": info.get("ask"),
    }


def load_seed_frames() -> Dict[str, pd.DataFrame]:
    return {
        "etfs": pd.read_csv(SEED_DIR / "etfs.csv"),
        "daily_inputs": pd.read_csv(SEED_DIR / "daily_inputs.csv"),
        "events": pd.read_csv(SEED_DIR / "events.csv").fillna(""),
    }


def load_yahoo_test_frames(tickers: Iterable[str], benchmark: str) -> Dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("Install yfinance to use --source yahoo_test.") from exc

    ticker_list = [ticker.upper() for ticker in tickers]
    benchmark = benchmark.upper()
    if benchmark not in ticker_list:
        ticker_list.append(benchmark)

    histories = {}
    for ticker in ticker_list:
        quote = yf.Ticker(ticker)
        metadata = yahoo_metadata(quote, ticker)
        history = quote.history(period="1mo", interval="1d", auto_adjust=False)
        history = history.dropna(subset=["Close"])
        if len(history) < 2:
            raise RuntimeError(f"Yahoo test source returned fewer than two daily rows for {ticker}.")
        histories[ticker] = {"history": history, "metadata": metadata}

    benchmark_history = histories[benchmark]["history"]
    benchmark_prior = float(benchmark_history["Close"].iloc[-2])
    benchmark_latest = float(benchmark_history["Close"].iloc[-1])
    etf_rows = []
    input_rows = []

    for ticker in ticker_list:
        if ticker == benchmark and benchmark not in [item.upper() for item in tickers]:
            continue
        history = histories[ticker]["history"]
        latest = history.iloc[-1]
        prior = history.iloc[-2]
        close = float(latest["Close"])
        metadata = histories[ticker]["metadata"]
        nav = float(metadata["nav"] or close)
        bid = float(metadata["bid"] or close)
        ask = float(metadata["ask"] or close)
        missing_critical_fields = sum(
            [
                not metadata["nav"],
                not metadata["bid"],
                not metadata["ask"],
                not metadata["aum_millions"],
            ]
        )
        volume = float(latest.get("Volume", 0) or 0)
        avg_volume = float(history["Volume"].tail(20).mean() or 1)
        returns = history["Close"].pct_change().dropna().tail(20)
        realized_vol = float(returns.std() * (252 ** 0.5) * 100) if len(returns) > 1 else 0.0

        etf_rows.append(
            {
                "ticker": ticker,
                "name": metadata["name"],
                "region": "US",
                "currency": "USD",
                "asset_class": metadata["asset_class"],
                "benchmark_proxy": benchmark,
                "aum_millions": metadata["aum_millions"],
                "expense_ratio_bps": metadata["expense_ratio_bps"],
                "source_tag": "unknown_license",
            }
        )
        input_rows.append(
            {
                "ticker": ticker,
                "prior_price": float(prior["Close"]),
                "price": close,
                "prior_nav": float(prior["Close"]),
                "nav": nav,
                "prior_benchmark": benchmark_prior,
                "benchmark": benchmark_latest,
                "bid": bid,
                "ask": ask,
                "volume": volume,
                "avg_volume_20d": avg_volume or 1,
                "realized_vol_20d_pct": realized_vol,
                "vol_20d_mean_pct": realized_vol,
                "vol_20d_std_pct": 1.0,
                "open_ca_count": 0,
                "pcf_age_days": 0,
                "missing_critical_fields": missing_critical_fields,
                "awaiting_confirmation": False,
            }
        )

    return {
        "etfs": pd.DataFrame(etf_rows),
        "daily_inputs": pd.DataFrame(input_rows),
        "histories": {ticker: item["history"] for ticker, item in histories.items()},
        "events": pd.DataFrame(
            [
                {
                    "id": "evt_yahoo_test_limitations",
                    "event_type": "data_quality",
                    "title": "Yahoo Finance test feed uses close/ohlc proxies only",
                    "entity_name": "Yahoo Finance via yfinance",
                    "entity_id": "YAHOO_FINANCE_TEST",
                    "impacted_tickers": "|".join([ticker.upper() for ticker in tickers]),
                    "exposure_pct": "",
                    "severity": "grey",
                    "rule_ids": "DATA_QUALITY_GAP",
                    "suggested_workflow": "Use this feed only for local testing; do not publish or redistribute without confirming data rights.",
                    "evidence_id": "evd_yahoo_test_limitations",
                    "source_tag": "unknown_license",
                }
            ]
        ),
    }


def source_warnings(source: str = "seed") -> list[str]:
    if source == "yahoo_test":
        return [
            "Yahoo Finance test feed via yfinance. Local testing only; confirm Yahoo terms before any redistribution.",
            "Yahoo Finance charts use one-month close/volume history; ETF NAV history, PCF, and bid-ask history remain proxy fields.",
        ]
    return [
        "HK public event feed unavailable; using seed fixture.",
        "Licensed vendor placeholders contain no real vendor data.",
    ]

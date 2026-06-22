from __future__ import annotations

import math
from datetime import date
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


def garch_11_forecast_vol_pct(returns: pd.Series) -> float:
    clean = returns.dropna().astype(float)
    if len(clean) < 30:
        return float(clean.tail(20).std() * (252**0.5) * 100) if len(clean) > 1 else 0.0

    demeaned = clean - clean.mean()
    unconditional_var = float(demeaned.var())
    if pd.isna(unconditional_var) or unconditional_var <= 0:
        return 0.0

    best_score = float("inf")
    best_forecast_var = unconditional_var
    alpha_grid = [0.03, 0.05, 0.08, 0.1, 0.12, 0.15]
    beta_grid = [0.7, 0.8, 0.85, 0.9, 0.94]
    observations = demeaned.to_list()

    for alpha in alpha_grid:
        for beta in beta_grid:
            if alpha + beta >= 0.995:
                continue
            omega = max(unconditional_var * (1 - alpha - beta), 1e-12)
            variance = unconditional_var
            score = 0.0
            for value in observations:
                variance = max(variance, 1e-12)
                score += math.log(variance) + (value * value) / variance
                variance = omega + alpha * value * value + beta * variance
            if score < best_score:
                best_score = score
                best_forecast_var = variance

    return float((best_forecast_var * 252) ** 0.5 * 100)


def load_yahoo_test_frames(tickers: Iterable[str], benchmark: str) -> Dict[str, Any]:
    try:
        import yfinance as yf
    except ImportError as exc:
        raise RuntimeError("Install yfinance to use --source yahoo_test.") from exc

    ticker_list = [ticker.upper() for ticker in tickers]
    benchmark = benchmark.upper()

    histories = {}
    for ticker in ticker_list:
        quote = yf.Ticker(ticker)
        metadata = yahoo_metadata(quote, ticker)
        history = quote.history(period="1y", interval="1d", auto_adjust=False)
        history = history.dropna(subset=["Close"])
        if len(history) < 2:
            raise RuntimeError(f"Yahoo test source returned fewer than two daily rows for {ticker}.")
        histories[ticker] = {"history": history, "metadata": metadata}

    etf_rows = []
    input_rows = []

    for ticker in ticker_list:
        history = histories[ticker]["history"]
        metric_history = history
        latest_date = pd.Timestamp(history.index[-1]).date()
        if latest_date >= date.today() and len(history) > 2:
            metric_history = history.iloc[:-1]
        latest = metric_history.iloc[-1]
        prior = metric_history.iloc[-2]
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
        avg_volume = float(metric_history["Volume"].tail(20).mean() or 1)
        returns = metric_history["Close"].pct_change().dropna()
        recent_returns = returns.tail(20)
        realized_vol = float(recent_returns.std() * (252 ** 0.5) * 100) if len(recent_returns) > 1 else 0.0
        rolling_vol = returns.rolling(window=20).std().dropna() * (252 ** 0.5) * 100
        vol_mean = float(rolling_vol.mean()) if len(rolling_vol) > 1 else realized_vol
        vol_std = float(rolling_vol.std()) if len(rolling_vol) > 1 else 1.0
        if pd.isna(vol_std) or vol_std == 0:
            vol_std = 1.0
        garch_vol_forecast = garch_11_forecast_vol_pct(returns)

        etf_rows.append(
            {
                "ticker": ticker,
                "name": metadata["name"],
                "region": "US",
                "currency": "USD",
                "asset_class": metadata["asset_class"],
                "benchmark_proxy": "Self proxy (no official benchmark data)",
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
                "prior_benchmark": float(prior["Close"]),
                "benchmark": close,
                "bid": bid,
                "ask": ask,
                "volume": volume,
                "avg_volume_20d": avg_volume or 1,
                "realized_vol_20d_pct": realized_vol,
                "garch_vol_forecast_1d_pct": garch_vol_forecast,
                "vol_20d_mean_pct": vol_mean,
                "vol_20d_std_pct": vol_std,
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
                    "title": "Yahoo Finance test feed uses one-year close/volume history",
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
            "Yahoo Finance charts and GARCH forecasts use one-year close/volume history; ETF NAV history, PCF, bid-ask history, and official benchmark history remain proxy fields.",
            "When Yahoo includes a current-date partial bar, daily control metrics use the prior completed daily bar to avoid false low-volume alerts.",
        ]
    return [
        "HK public event feed unavailable; using seed fixture.",
        "Licensed vendor placeholders contain no real vendor data.",
    ]

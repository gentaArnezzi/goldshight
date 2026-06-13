"""
preprocessing.py — Feature engineering for GoldSight pipeline.

Extracted from Jupyter Notebooks 01 (data collection) and 02 (preprocessing).
Produces the same features used during thesis model training.
"""

import warnings
from datetime import datetime, timedelta

import numpy as np
import pandas as pd
import yfinance as yf

warnings.filterwarnings("ignore")

# ── Constants (matching notebooks) ──────────────────────────────────────────

HORIZON = 5  # 5-trading-day cumulative return

TICKERS = {
    "GLD": "GOLD",      # Gold ETF (proxy for gold price)
    "DX-Y.NYB": "DXY",  # US Dollar Index
    "^GSPC": "SP500",    # S&P 500
    "CL=F": "OIL",      # Crude Oil Futures
    "^TNX": "US10Y",     # 10-Year Treasury Yield
    "^VIX": "VIX",       # CBOE Volatility Index
}

CORE_FEATURE_BASES = [
    "GOLD_RET",
    "DXY_RET",
    "SP500_RET",
    "OIL_RET",
    "US10Y_CHANGE",
    "VIX_LEVEL",
]

# Feature groups (for ablation)
GROUP_1_DOLLAR_RATES = ["DXY_RET", "US10Y_CHANGE"]
GROUP_2_RISK = ["SP500_RET", "VIX_LEVEL"]
GROUP_3_COMMODITY = ["OIL_RET"]

# NO_G3 bases (best package for both XGBoost and LSTM)
NO_G3_BASES = [b for b in CORE_FEATURE_BASES if b not in GROUP_3_COMMODITY]

XGB_LAGS = [1, 2, 3, 4, 5, 6, 7]
LSTM_WINDOW = 7


# ── Data Collection ─────────────────────────────────────────────────────────

def _make_session():
    """
    Create a requests session pre-warmed with Yahoo cookies.
    Hitting fc.yahoo.com sets cookies that yfinance needs for TZ lookups.
    Without these cookies, yfinance fails on CI/cloud environments.
    """
    import requests as req
    session = req.Session()
    session.headers.update({
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        ),
    })
    # Pre-warm: fc.yahoo.com returns 404 but sets required cookies
    try:
        session.get("https://fc.yahoo.com", timeout=10)
    except Exception:
        pass
    return session


def pull_yahoo_data(
    start: str = "2010-01-01",
    end: str | None = None,
    max_retries: int = 3,
) -> pd.DataFrame:
    """
    Pull raw price data from Yahoo Finance.
    Returns a DataFrame with columns: DATE, GOLD, DXY, SP500, OIL, US10Y, VIX.
    """
    if end is None:
        end = (datetime.utcnow() + timedelta(days=1)).strftime("%Y-%m-%d")

    session = _make_session()
    ticker_list = list(TICKERS.keys())

    for attempt in range(max_retries):
        try:
            # Download all tickers in a single batch call
            raw = yf.download(
                ticker_list,
                start=start,
                end=end,
                auto_adjust=True,
                progress=False,
                group_by="ticker",
                threads=False,
                session=session,
            )

            if raw.empty:
                raise ValueError("Batch download returned empty DataFrame")

            # Extract Close prices for each ticker
            frames = {}
            for ticker, name in TICKERS.items():
                try:
                    if len(ticker_list) > 1:
                        series = raw[ticker]["Close"]
                    else:
                        series = raw["Close"]
                except KeyError:
                    raise ValueError(f"Ticker {ticker} not found in download")

                if series.dropna().empty:
                    raise ValueError(f"No data for {ticker}")

                frames[name] = series.rename(name)

            combined = pd.concat(frames.values(), axis=1, join="inner")
            combined = combined.dropna()
            combined = combined.reset_index()

            # Normalize the date column name
            date_col = combined.columns[0]
            combined = combined.rename(columns={date_col: "DATE"})
            combined["DATE"] = pd.to_datetime(combined["DATE"])

            # Remove timezone info if present
            if combined["DATE"].dt.tz is not None:
                combined["DATE"] = combined["DATE"].dt.tz_localize(None)

            combined = combined.sort_values("DATE").reset_index(drop=True)

            print(f"  Pulled {len(combined)} trading days "
                  f"({combined['DATE'].min().date()} to {combined['DATE'].max().date()})")
            return combined

        except Exception as e:
            if attempt < max_retries - 1:
                import time
                wait = (attempt + 1) * 30
                print(f"  Retry {attempt + 1}/{max_retries} after error: {e}. Waiting {wait}s...")
                time.sleep(wait)
            else:
                raise RuntimeError(f"Failed to pull Yahoo data after {max_retries} attempts: {e}")



# ── Feature Engineering ─────────────────────────────────────────────────────

def compute_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute core features from raw price data.
    Mirrors notebook 02, Cell 8.
    """
    out = df[["DATE", "GOLD", "DXY", "US10Y", "VIX", "SP500", "OIL"]].copy()

    out["GOLD_RET"] = out["GOLD"].pct_change()
    out["DXY_RET"] = out["DXY"].pct_change()
    out["SP500_RET"] = out["SP500"].pct_change()
    out["OIL_RET"] = out["OIL"].pct_change()
    out["US10Y_CHANGE"] = out["US10Y"].diff()
    out["VIX_LEVEL"] = out["VIX"]

    out = out.dropna().reset_index(drop=True)
    return out


def compute_target(df: pd.DataFrame, horizon: int = HORIZON) -> pd.DataFrame:
    """
    Compute 5-day cumulative return target.
    TARGET_5D = (GOLD_{t+5} / GOLD_t) - 1
    Mirrors notebook 02, Cell 11.
    """
    out = df.copy()
    out["TARGET_DATE"] = out["DATE"].shift(-horizon)
    out["TARGET_5D"] = (out["GOLD"].shift(-horizon) / out["GOLD"]) - 1
    out = out.dropna(subset=["TARGET_DATE", "TARGET_5D"]).reset_index(drop=True)
    out["TARGET_DATE"] = pd.to_datetime(out["TARGET_DATE"])
    out["TARGET_DIRECTION"] = (out["TARGET_5D"] > 0).astype(int)
    return out


def add_xgb_lags(
    df: pd.DataFrame,
    bases: list[str] | None = None,
    lags: list[int] | None = None,
) -> pd.DataFrame:
    """
    Add lag features for XGBoost. Mirrors notebook 02, Cell 19.
    """
    if bases is None:
        bases = NO_G3_BASES
    if lags is None:
        lags = XGB_LAGS

    out = df.copy()
    for col in bases:
        for lag in lags:
            out[f"{col}_LAG{lag}"] = out[col].shift(lag)

    out = out.dropna().reset_index(drop=True)
    return out


def add_lstm_sequences(
    df: pd.DataFrame,
    bases: list[str] | None = None,
    window: int = LSTM_WINDOW,
) -> pd.DataFrame:
    """
    Add sequence columns for LSTM. Mirrors notebook 02, Cell 20.
    Feature columns named: {base}_T0, {base}_T1, ..., {base}_T{window-1}
    where T0 is the most recent (current) value.
    """
    if bases is None:
        bases = NO_G3_BASES

    out = df.copy()
    for step in range(window):
        for base in bases:
            out[f"{base}_T{step}"] = out[base].shift(step)

    out = out.dropna().reset_index(drop=True)
    return out


def get_no_g3_xgb_feature_cols(bases: list[str] | None = None) -> list[str]:
    """Return NO_G3 feature column names for XGBoost (current + lags)."""
    if bases is None:
        bases = NO_G3_BASES
    cols = []
    for base in bases:
        cols.append(base)  # current value
        for lag in XGB_LAGS:
            cols.append(f"{base}_LAG{lag}")
    return cols


def get_no_g3_lstm_feature_cols(bases: list[str] | None = None) -> list[str]:
    """Return NO_G3 feature column names for LSTM (sequence T0..T6)."""
    if bases is None:
        bases = NO_G3_BASES
    cols = []
    for step in range(LSTM_WINDOW):
        for base in bases:
            cols.append(f"{base}_T{step}")
    return cols

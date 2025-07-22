#!/usr/bin/env python3
# scripts/bulk_download_top100.py

import time
from pathlib import Path

import requests
import pandas as pd
import yfinance as yf
from bs4 import BeautifulSoup

OUTPUT_DIR = Path("data/top100_intraday")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

PAUSE_SEC = 0.2  # seconds between symbols

def get_sp100_tickers():
    """Scrape the S&P 100 symbols from Wikipedia."""
    URL = "https://en.wikipedia.org/wiki/S%26P_100"
    resp = requests.get(URL, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    table = soup.find("table", {"id": "constituents"})
    syms = []
    for row in table.tbody.find_all("tr")[1:]:
        sym = row.find_all("td")[0].get_text(strip=True).replace(".", "-")
        syms.append(sym)
    return syms

def process_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    1) Drop any tzinfo on the index → make it tz-naive.
    2) Name the index "Date", reset it into a "Date" column.
    3) Ensure we always have [Date, Open, High, Low, Close, Adj Close, Volume].
    """
    # copy to avoid side-effects
    df = pd.DataFrame() if df is None else df.copy()

    # strip tz
    if hasattr(df.index, "tz") and df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    # name + reset index
    df.index.name = "Date"
    df = df.reset_index()

    # if empty, just return the right schema
    if df.empty:
        return pd.DataFrame(columns=["Date","Open","High","Low","Close","Adj Close","Volume"])

    # yfinance w/ auto_adjust=True drops "Adj Close"
    if "Adj Close" not in df.columns:
        if "Close" in df.columns:
            df["Adj Close"] = df["Close"]
        else:
            df["Adj Close"] = pd.NA

    # make sure OHLCV are all present
    for col in ["Open","High","Low","Close","Volume"]:
        if col not in df.columns:
            df[col] = pd.NA

    # keep only the seven columns, in order
    return df[["Date","Open","High","Low","Close","Adj Close","Volume"]]

def fetch_and_combine(symbol: str):
    """
    • 1 m bars for last 7 days  
    • 5 m bars for last 60 days  
    • 1 d bars for max history  
    → process each, concat, drop duplicates (keep highest‐res), sort, CSV.
    """
    try:
        tk = yf.Ticker(symbol)

        df1m = tk.history(period="7d",  interval="1m", auto_adjust=True)
        df5m = tk.history(period="60d", interval="5m", auto_adjust=True)
        df1d = tk.history(period="max", interval="1d", auto_adjust=True)

        d1 = process_df(df1m)
        d5 = process_df(df5m)
        dD = process_df(df1d)

        combined = pd.concat([d1, d5, dD], ignore_index=True)
        combined["Date"] = pd.to_datetime(combined["Date"])
        combined = (
            combined
            .drop_duplicates(subset=["Date"], keep="first")
            .sort_values("Date")
            .reset_index(drop=True)
        )

        out = OUTPUT_DIR / f"{symbol}.csv"
        combined.to_csv(out, index=False)
        print(f"✅ {symbol}: {len(combined)} rows → {out}")
    except Exception as e:
        print(f"❌ {symbol}: {e!r}")

def main(limit: int = None):
    tickers = get_sp100_tickers()
    if limit:
        tickers = tickers[:limit]
        print(f"🔖 Limiting to first {limit} symbols")
    print(f"⏳ Downloading {len(tickers)} symbols into {OUTPUT_DIR}/ …")

    # sequential to avoid yfinance thread‐safety bugs
    for sym in tickers:
        fetch_and_combine(sym)
        time.sleep(PAUSE_SEC)

    print("✅ All done.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""
scripts/bulk_download_top100.py

1) Scrapes the S&P 100 component list from Wikipedia
2) In parallel, fetches 'max' daily history via yfinance.download()
3) Skips any symbol file that already exists
4) Saves to data/top100/<SYMBOL>.csv
"""

import os
import time
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests
from bs4 import BeautifulSoup
import yfinance as yf

OUTPUT_DIR = Path("data/top100")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

MAX_WORKERS = 8    # threads
PAUSE_SEC   = 0.2  # throttle

def get_sp100_tickers():
    """Scrape S&P 100 symbols from Wikipedia table."""
    URL = "https://en.wikipedia.org/wiki/S%26P_100"
    resp = requests.get(URL, timeout=10)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    # The constituents table has id="constituents"
    table = soup.find("table", {"id": "constituents"})
    symbols = []
    for row in table.tbody.find_all("tr")[1:]:
        cols = row.find_all("td")
        sym = cols[0].get_text(strip=True).replace(".", "-")
        symbols.append(sym)
    return symbols

def fetch_and_save(symbol: str) -> bool:
    """
    Download full daily history via yf.download().
    Returns True if new file was written, False if skipped or no data.
    """
    out_file = OUTPUT_DIR / f"{symbol}.csv"
    if out_file.exists():
        return False  # already have it

    try:
        df = yf.download(
            symbol,
            period="max",
            interval="1d",
            progress=False,
            threads=False     # safer in ThreadPoolExecutor
        )
        # sometimes returns a tuple (df, something) if pandas updated; guard:
        if hasattr(df, "empty") and not df.empty:
            df.to_csv(out_file, index_label="Date")
            return True
    except Exception as e:
        print(f"❌ Error for {symbol}: {e}")
    return False

def main(limit: int=None):
    tickers = get_sp100_tickers()
    if limit:
        tickers = tickers[:limit]
        print(f"🔖 Limiting to first {limit} S&P 100 symbols")

    print(f"⏳ Downloading {len(tickers)} symbols to {OUTPUT_DIR} with {MAX_WORKERS} workers…")
    saved, skipped = [], []

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as exe:
        futures = {exe.submit(fetch_and_save, sym): sym for sym in tickers}
        for fut in as_completed(futures):
            sym = futures[fut]
            try:
                ok = fut.result()
            except Exception as e:
                ok = False
                print(f"❌ Thread error for {sym}: {e}")
            if ok:
                saved.append(sym)
                print(f"✅ {sym}")
            else:
                skipped.append(sym)
                print(f"⏭ {sym}")
            time.sleep(PAUSE_SEC)

    print(f"\n✅ Finished: {len(saved)} saved, {len(skipped)} skipped/no-data.")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--limit", type=int,
                   help="Only download the first N symbols of the S&P 100 list")
    args = p.parse_args()
    main(limit=args.limit)

#!/usr/bin/env python3
"""
scripts/bulk_download.py

1) Reads tickers.txt
2) Uses yfinance to fetch 'max' daily history
3) Saves data/<SYMBOL>.csv for each
"""

import os
import time
import yfinance as yf

INPUT_FILE = "tickers.txt"
OUTPUT_DIR = "data"
PAUSE_SEC  = 1

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(INPUT_FILE) as f:
        tickers = [line.strip() for line in f if line.strip()]

    for symbol in tickers:
        print(f"Downloading {symbol:10} … ", end="", flush=True)
        try:
            df = yf.Ticker(symbol).history(period="max", interval="1d")
            if df.empty:
                print("no data")
            else:
                path = os.path.join(OUTPUT_DIR, f"{symbol}.csv")
                df.to_csv(path, index_label="Date")
                print(f"saved → {path}")
        except Exception as e:
            print(f"ERROR: {e}")
        time.sleep(PAUSE_SEC)

if __name__ == "__main__":
    main()

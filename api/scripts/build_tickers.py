#!/usr/bin/env python3
"""
scripts/build_tickers.py

1) Connects via FTP to ftp.nasdaqtrader.com
2) Retrieves nasdaqlisted.txt and otherlisted.txt
3) Parses out all valid, non-test-issue symbols
4) Appends key indices & crypto
5) Writes sorted ticker list to tickers.txt
"""

import csv
from ftplib import FTP, error_perm

# FTP details
FTP_HOST = "ftp.nasdaqtrader.com"
FTP_DIR  = "SymbolDirectory"
FILES    = {
    "nasdaqlisted.txt":    ("Symbol",     "Test Issue"),
    "otherlisted.txt":     ("ACT Symbol", "Test Issue"),
}
OUT_FILE = "tickers.txt"

# extra symbols beyond U.S. equities
EXTRAS = {
    "^GSPC", "^DJI", "^IXIC", "^RUT", "^FTSE", "^GDAXI", "^N225",
    "BTC-USD", "ETH-USD"
}

def fetch_file(filename):
    """Fetch a text file over FTP, return list of lines."""
    try:
        ftp = FTP(FTP_HOST, timeout=10)
        ftp.login()                     # anonymous login
        ftp.cwd(FTP_DIR)
        lines = []
        ftp.retrlines(f"RETR {filename}", lines.append)
        ftp.quit()
        return lines
    except error_perm as e:
        print(f"⚠️  FTP error retrieving {filename}: {e}")
    except Exception as e:
        print(f"⚠️  Error retrieving {filename}: {e}")
    return []

def parse(lines, sym_col, test_col):
    """Parse pipe-delimited lines into a set of tickers."""
    reader = csv.DictReader(lines, delimiter="|")
    syms = set()
    for row in reader:
        sym = row.get(sym_col, "").strip()
        if not sym or sym == sym_col:
            continue
        if row.get(test_col, "N").upper() == "Y":
            continue
        syms.add(sym)
    return syms

def main():
    all_syms = set()

    for fname, (sym_col, test_col) in FILES.items():
        print(f"⏳ Fetching {fname} via FTP…")
        lines = fetch_file(fname)
        if not lines:
            print(f"⚠️  No data from {fname}, skipping")
            continue
        syms = parse(lines, sym_col, test_col)
        print(f"  → {len(syms)} symbols from {fname}")
        all_syms |= syms

    # add extra non-stock symbols
    all_syms |= EXTRAS

    # write out
    with open(OUT_FILE, "w") as f:
        for s in sorted(all_syms):
            f.write(s + "\n")

    print(f"✅ Wrote {len(all_syms)} symbols to {OUT_FILE}")

if __name__ == "__main__":
    main()

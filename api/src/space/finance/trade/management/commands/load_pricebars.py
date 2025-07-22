# trade/management/commands/load_pricebars.py
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.utils.dateparse import parse_date
from src.space.finance.trade.models import PriceBar

class Command(BaseCommand):
    help = "Load daily price bars from data/top100/*.csv"

    def handle(self, *args, **options):
        data_dir = Path(settings.BASE_DIR) / "data" / "top100"
        files = sorted(data_dir.glob("*.csv"))
        for csv_path in files:
            symbol = csv_path.stem.upper()
            self.stdout.write(f"→ loading {symbol}…")
            with open(csv_path, newline='') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    # skip empty rows
                    if not row.get("Date"):
                        continue
                    dt = parse_date(row["Date"])
                    # upsert daily bar
                    PriceBar.objects.update_or_create(
                        symbol=symbol,
                        timeframe="1D",         # mark as daily bars
                        timestamp=dt,           # assume midnight UTC/local
                        defaults={
                            "open": float(row["Open"]),
                            "high": float(row["High"]),
                            "low": float(row["Low"]),
                            "close": float(row["Close"]),
                            "volume": int(row["Volume"]),
                        },
                    )
            self.stdout.write(self.style.SUCCESS(f"  ✓ {symbol} done"))

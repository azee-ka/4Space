# src/space/finance/trade/views.py

import datetime
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

import pandas as pd

from .models import Watchlist
from .serializers import WatchlistSerializer

CSV_DIR = Path(settings.BASE_DIR) / "data" / "top100_intraday"

# How many calendar days to show per timeframe
SPAN_DAYS = {
    "1W":   7,
    "1M":  30,
    "3M":  90,
    "6M": 180,
    "YTD": None,    # handled specially
    "1Y": 365,
    "2Y": 730,
    "5Y": 1825,
    "10Y": 3650,
}


@api_view(["GET"])
@permission_classes([AllowAny])
def chart_data(request):
    sym = request.GET.get("symbol", "").upper()
    tf  = request.GET.get("tf", "1D").upper()
    today = datetime.date.today()

    # ── compute cutoffs ─────────────────────────────────────────
    if tf in ("1D", "1W", "1M"):
        span = {"1D": 1, "1W": SPAN_DAYS["1W"], "1M": SPAN_DAYS["1M"]}[tf]
        cutoff_dt = datetime.datetime.combine(
            today - datetime.timedelta(days=span),
            datetime.time.min,
        )
        cutoff_date = None
    elif tf == "YTD":
        cutoff_date = datetime.date(today.year, 1, 1)
        cutoff_dt = None
    elif tf in SPAN_DAYS and SPAN_DAYS[tf] is not None:
        cutoff_date = today - datetime.timedelta(days=SPAN_DAYS[tf])
        cutoff_dt = None
    else:  # MAX
        cutoff_date = None
        cutoff_dt = None

    # ── load CSV ───────────────────────────────────────────────────
    csv_path = CSV_DIR / f"{sym}.csv"
    if not csv_path.exists():
        raise Http404(f"No CSV for {sym}")
    try:
        df = pd.read_csv(csv_path, parse_dates=["Date"])
    except Exception as e:
        raise Http404(f"Could not read CSV for {sym}: {e}")

    # ── pick price ─────────────────────────────────────────────────
    if "Adj Close" in df.columns:
        df["price"] = df["Adj Close"]
    elif "Close" in df.columns:
        df["price"] = df["Close"]
    else:
        raise Http404(f"No Close/Adj Close column for {sym}")

    # ── sort & index ────────────────────────────────────────────────
    df = df.sort_values("Date")
    ts = df.set_index("Date")["price"]
    data = []

    # ── 1D: every tick ─────────────────────────────────────────────
    if tf == "1D":
        window = ts if not cutoff_dt else ts[ts.index >= cutoff_dt]
        if window.empty:
            window = ts
        for dt, val in window.items():
            data.append({"x": dt.isoformat(), "y": float(val)})

    # ── 1W & 1M: hourly bars over trading hours ────────────────────
    elif tf in ("1W", "1M"):
        window = ts if not cutoff_dt else ts[ts.index >= cutoff_dt]

        # for each calendar day in the span
        start_date = cutoff_dt.date()
        for day in (
            start_date + datetime.timedelta(days=i)
            for i in range((today - start_date).days + 1)
        ):
            # skip weekends
            if day.weekday() >= 5:
                continue

            # market hours: 9:30 → 16:00
            day_start = datetime.datetime.combine(day, datetime.time(9, 30))
            day_end   = datetime.datetime.combine(day, datetime.time(16,   0))

            # hourly timestamps
            for hr in pd.date_range(start=day_start, end=day_end, freq="1H"):
                # pick last trade ≤ this hour
                past = window[window.index <= hr]
                if past.empty:
                    continue
                last_price = past.iloc[-1]
                data.append({"x": hr.isoformat(), "y": float(last_price)})

    # ── 3M–2Y & beyond: daily closes, gap-fill, down-sample ────────
    else:
        df["day"] = df["Date"].dt.date
        daily = df.groupby("day", as_index=False)["price"].last()

        if tf != "MAX":
            days = [
                cutoff_date + datetime.timedelta(days=i)
                for i in range((today - cutoff_date).days + 1)
            ]
            last = None
            price_map = dict(zip(daily["day"], daily["price"]))
            for d in days:
                if d in price_map:
                    last = price_map[d]
                if last is not None:
                    data.append({"x": d.isoformat(), "y": float(last)})
        else:
            for _, row in daily.iterrows():
                data.append({"x": row["day"].isoformat(), "y": float(row["price"])})

        if tf in ("5Y", "10Y", "MAX"):
            filtered = [pt for pt in data if pt["y"] is not None]
            step = 5 if tf == "5Y" else 4 if tf == "10Y" else 7
            sampled = filtered[::step]
            if sampled:
                sampled.append(sampled[-1])
            data = sampled

    return JsonResponse({"datasets": [{"label": sym, "data": data}]})


@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def watchlist_list(request):
    if request.method == "GET":
        qs = Watchlist.objects.filter(user=request.user)
        return JsonResponse(WatchlistSerializer(qs, many=True).data, safe=False)
    ser = WatchlistSerializer(data=request.data, context={"request": request})
    ser.is_valid(raise_exception=True)
    ser.save()
    return JsonResponse(ser.data, status=201)


@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def watchlist_detail(request, pk):
    try:
        wl = Watchlist.objects.get(pk=pk, user=request.user)
    except Watchlist.DoesNotExist:
        raise Http404
    if request.method == "GET":
        return JsonResponse(WatchlistSerializer(wl).data)
    if request.method == "PUT":
        ser = WatchlistSerializer(wl, data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return JsonResponse(ser.data)
    wl.delete()
    return JsonResponse({}, status=204)

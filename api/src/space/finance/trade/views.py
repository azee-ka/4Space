# src/space/finance/trade/views.py

import datetime
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Watchlist
from .serializers import WatchlistSerializer

CSV_DIR = Path(settings.BASE_DIR) / "data" / "top100"

# How many calendar days to show per timeframe
SPAN_DAYS = {
    "1W": 7,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "YTD": None,  # compute below
    "1Y": 365,
    "2Y": 730,
    "5Y": 1825/4,
    "10Y": 3650/8,
}


@api_view(["GET"])
@permission_classes([AllowAny])
def chart_data(request):
    sym = request.GET.get("symbol", "").upper()
    tf  = request.GET.get("tf", "1D").upper()

    today = datetime.date.today()
    # 1D we treat specially (live‐dot, jitter, etc)
    if tf == "1D":
        cutoff = today - datetime.timedelta(days=1)
    # compute calendar‐day span
    elif tf in SPAN_DAYS and SPAN_DAYS[tf] is not None:
        span = SPAN_DAYS[tf]
        cutoff = today - datetime.timedelta(days=span)
    elif tf == "YTD":
        cutoff = datetime.date(today.year, 1, 1)
    else:  # MAX
        cutoff = datetime.date.min

    # load the per‐ticker CSV
    csv_path = CSV_DIR / f"{sym}.csv"
    if not csv_path.exists():
        raise Http404(f"No CSV for {sym} at {csv_path}")

    # read and locate your multi‐row header
    lines = csv_path.read_text().splitlines()
    if len(lines) < 4:
        raise Http404(f"{sym}.csv too short")

    header0 = lines[0].split(",")
    header1 = lines[1].split(",")

    # find the first "Close" column under our ticker
    close_idxs = [
        i for i, (typ, tickr) in enumerate(zip(header0, header1))
        if tickr.upper() == sym and typ == "Close"
    ]
    if not close_idxs:
        raise Http404(f"No Close column for {sym}")

    # parse all the CSV rows into (date, price)
    all_points = []
    for row in lines[3:]:
        parts = row.split(",")
        if len(parts) <= close_idxs[0]:
            continue
        d = parts[0].strip()
        c = parts[ close_idxs[0] ].strip()
        if not d or not c:
            continue
        try:
            dt = datetime.date.fromisoformat(d)
            price = float(c)
        except ValueError:
            continue
        all_points.append((dt, price))

    # if it's a 1D timeframe, we just return *all* of those points after cutoff
    if tf == "1D":
        data = [
            {"x": dt.isoformat(), "y": price}
            for dt, price in all_points
            if dt >= cutoff
        ]
        # fall back to everything if the slice is empty
        if not data:
            data = [{"x": dt.isoformat(), "y": price} for dt, price in all_points]

    # for everything else except MAX, build a calendar‐daily series
    elif tf != "MAX":
        # rebuild a map for quick lookup
        price_map = {dt: price for dt, price in all_points}
        # for YTD, override span
        if tf == "YTD":
            span = (today - cutoff).days
        # # days between cutoff and today, inclusive
        total_days = (today - cutoff).days + 1
        data = []
        for i in range(total_days):
            day = cutoff + datetime.timedelta(days=i)
            # get price if exists, else None
            data.append({
                "x": day.isoformat(),
                "y": price_map.get(day)  # null on weekends
            })

    # for MAX, just send every data point we have
    else:
        data = [{"x": dt.isoformat(), "y": price} for dt, price in all_points]

    return JsonResponse({
        "datasets": [
            {"label": sym, "data": data}
        ]
    })


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

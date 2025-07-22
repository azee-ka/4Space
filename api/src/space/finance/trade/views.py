# src/space/finance/trade/views.py

import datetime
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

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

    # ─── Compute cutoff ─────────────────────────────────────────
    if tf == "1D":
        cutoff = today - datetime.timedelta(days=1)
    elif tf in SPAN_DAYS and SPAN_DAYS[tf] is not None:
        cutoff = today - datetime.timedelta(days=SPAN_DAYS[tf])
    elif tf == "YTD":
        cutoff = datetime.date(today.year, 1, 1)
    else:  # MAX
        cutoff = datetime.date.min

    # ─── Load CSV & locate “Close” column ───────────────────────
    csv_path = CSV_DIR / f"{sym}.csv"
    if not csv_path.exists():
        raise Http404(f"No CSV for {sym}")
    lines = csv_path.read_text().splitlines()
    if len(lines) < 4:
        raise Http404(f"{sym}.csv too short")

    header0 = lines[0].split(",")
    header1 = lines[1].split(",")
    close_idxs = [
        i for i, (typ, tickr) in enumerate(zip(header0, header1))
        if typ.strip().lower() == "close" and tickr.upper() == sym
    ]
    if not close_idxs:
        raise Http404(f"No Close column for {sym}")
    ci = close_idxs[0]

    all_points = []
    for row in lines[3:]:
        parts = row.split(",")
        if len(parts) <= ci:
            continue
        d, c = parts[0].strip(), parts[ci].strip()
        if not d or not c:
            continue
        try:
            dt = datetime.date.fromisoformat(d)
            price = float(c)
        except ValueError:
            continue
        all_points.append((dt, price))

    # ─── Build the raw daily series ─────────────────────────────
    if tf == "1D":
        # just return all 1D points
        data = [
            {"x": dt.isoformat(), "y": price}
            for dt, price in all_points
            if dt >= cutoff
        ] or [
            {"x": dt.isoformat(), "y": price}
            for dt, price in all_points
        ]

    elif tf != "MAX":
        # generate every calendar day, with gaps (None)
        price_map = {dt: price for dt, price in all_points}
        num_days = (today - cutoff).days + 1
        data = []
        last_price = None
        for i in range(num_days):
            day = cutoff + datetime.timedelta(days=i)
            if day in price_map:
                last_price = price_map[day]
            # fill weekends/holidays with last known
            if last_price is not None:
                data.append({"x": day.isoformat(), "y": last_price})
        # at this point data covers _every_ day from cutoff→today

    else:  # MAX
        # full history, one point per actual CSV row
        data = [{"x": dt.isoformat(), "y": price} for dt, price in all_points]

    # ─── Down-sample only for very long spans ────────────────────
    if tf in ("5Y", "10Y", "MAX"):
        # ensure no nulls
        data = [pt for pt in data if pt["y"] is not None]

        if tf == "5Y":
            data = [pt for idx, pt in enumerate(data) if idx % 5 == 0]
        elif tf == "10Y":
            data = [pt for idx, pt in enumerate(data) if idx % 4 == 0]
        else:  # MAX
            data = [pt for idx, pt in enumerate(data) if idx % 7 == 0]

        # always end on the very last available
        if data:
            data.append(data[-1])

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

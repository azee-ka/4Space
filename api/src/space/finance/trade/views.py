import csv
import datetime
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse, Http404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny

from .models import PriceBar, Watchlist
from .serializers import WatchlistSerializer

# where your CSV-imported data lives (BASE_DIR/data/)
DATA_DIR = Path(settings.BASE_DIR) / "data"  # adjust to point at your CSV folder

# ─── Chart data view ────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([AllowAny])
def chart_data(request):
    """
    GET /api/chart-data/?symbol=XYZ&tf=1W|1M|…|MAX
    Returns JSON: { datasets: [{ label: 'XYZ', data: [{ x, y }, …] }] }
    """
    sym = request.GET.get("symbol", "").upper()
    tf  = request.GET.get("tf", "1D").upper()

    # map timeframe to cutoff date
    today = datetime.date.today()
    if tf == "1D":
        cutoff = datetime.date.min  # return all; front-end shows live dot
    elif tf == "1W":
        cutoff = today - datetime.timedelta(weeks=1)
    elif tf == "1M":
        cutoff = today - datetime.timedelta(days=30)
    elif tf == "3M":
        cutoff = today - datetime.timedelta(days=90)
    elif tf == "6M":
        cutoff = today - datetime.timedelta(days=180)
    elif tf == "YTD":
        cutoff = datetime.date(today.year, 1, 1)
    elif tf == "1Y":
        cutoff = today - datetime.timedelta(days=365)
    elif tf == "2Y":
        cutoff = today - datetime.timedelta(days=730)
    elif tf == "5Y":
        cutoff = today - datetime.timedelta(days=1825)
    elif tf == "10Y":
        cutoff = today - datetime.timedelta(days=3650)
    else:  # MAX
        cutoff = datetime.date.min

    # Query the DB — super fast with indexes
    bars = PriceBar.objects.filter(
        symbol=sym,
        timeframe=tf,
        timestamp__date__gte=cutoff
    ).order_by("timestamp")

    data = [
        {"x": bar.timestamp.isoformat(), "y": bar.close}
        for bar in bars
    ]

    return JsonResponse({
        "datasets": [
            {"label": sym, "data": data}
        ]
    })

# ─── Watchlist CRUD ──────────────────────────────────────────────

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def watchlist_list(request):
    """
    GET  /api/watchlists/       → list current user's watchlists
    POST /api/watchlists/       → create new watchlist
    """
    if request.method == "GET":
        qs = Watchlist.objects.filter(user=request.user)
        data = WatchlistSerializer(qs, many=True).data
        return JsonResponse(data, safe=False)

    # POST
    ser = WatchlistSerializer(data=request.data,
                              context={"request": request})
    ser.is_valid(raise_exception=True)
    wl = ser.save()
    return JsonResponse(ser.data, status=201)

@api_view(["GET", "PUT", "DELETE"])
@permission_classes([IsAuthenticated])
def watchlist_detail(request, pk):
    """
    GET    /api/watchlists/{pk}/  → retrieve
    PUT    /api/watchlists/{pk}/  → update name/items
    DELETE /api/watchlists/{pk}/  → delete
    """
    try:
        wl = Watchlist.objects.get(pk=pk, user=request.user)
    except Watchlist.DoesNotExist:
        raise Http404

    if request.method == "GET":
        return JsonResponse(WatchlistSerializer(wl).data)

    if request.method == "PUT":
        ser = WatchlistSerializer(wl, data=request.data,
                                  context={"request": request})
        ser.is_valid(raise_exception=True)
        ser.save()
        return JsonResponse(ser.data)

    # DELETE
    wl.delete()
    return JsonResponse({}, status=204)

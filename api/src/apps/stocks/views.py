# views.py
from rest_framework import viewsets
from .models import FinancialInstrument, Watchlist
from .serializers import FinancialInstrumentSerializer, WatchlistSerializer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from rest_framework.decorators import action
from rest_framework.response import Response

class FinancialInstrumentViewSet(viewsets.ModelViewSet):
    queryset = FinancialInstrument.objects.all()
    serializer_class = FinancialInstrumentSerializer

class WatchlistViewSet(viewsets.ModelViewSet):
    queryset = Watchlist.objects.all()
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def add_instrument(self, request):
        instrument_id = request.data.get('instrument_id')
        instrument = FinancialInstrument.objects.get(id=instrument_id)
        watchlist, created = Watchlist.objects.get_or_create(user=request.user)
        watchlist.instruments.add(instrument)
        watchlist.save()
        return Response({'status': 'instrument added'})

    @action(detail=False, methods=['post'])
    def remove_instrument(self, request):
        instrument_id = request.data.get('instrument_id')
        instrument = FinancialInstrument.objects.get(id=instrument_id)
        watchlist = Watchlist.objects.get(user=request.user)
        watchlist.instruments.remove(instrument)
        watchlist.save()
        return Response({'status': 'instrument removed'})

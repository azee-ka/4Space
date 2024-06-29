# stocks/serializers.py
from rest_framework import serializers
from .models import Stock, Watchlist

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['symbol', 'description', 'display_symbol', 'type']

class WatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Watchlist
        fields = ['id', 'stocks']

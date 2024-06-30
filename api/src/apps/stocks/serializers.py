# stocks/serializers.py
from rest_framework import serializers
from .models import Stock, Watchlist

class StockSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stock
        fields = ['id', 'symbol', 'description', 'industry', 'display_symbol', 'market_capitalization']

class WatchlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Watchlist
        fields = ['id', 'stocks']

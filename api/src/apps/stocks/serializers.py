# serializers.py
from rest_framework import serializers
from .models import FinancialInstrument, Watchlist

class FinancialInstrumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialInstrument
        fields = '__all__'

class WatchlistSerializer(serializers.ModelSerializer):
    instruments = FinancialInstrumentSerializer(many=True)

    class Meta:
        model = Watchlist
        fields = '__all__'

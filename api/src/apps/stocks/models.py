# models.py
from django.contrib.auth.models import User
from django.db import models

class FinancialInstrument(models.Model):
    INSTRUMENT_TYPES = (
        ('stock', 'Stock'),
        ('etf', 'ETF'),
        ('fund', 'Fund'),
    )
    ticker = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=255)
    instrument_type = models.CharField(max_length=10, choices=INSTRUMENT_TYPES)

    def __str__(self):
        return f"{self.name} ({self.ticker})"

class Watchlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    instruments = models.ManyToManyField(FinancialInstrument)

    def __str__(self):
        return f"{self.user.username}'s Watchlist"

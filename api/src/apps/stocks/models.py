# stocks/models.py
from django.db import models
from ...user.baseUser.models import BaseUser

class Stock(models.Model):
    symbol = models.CharField(max_length=20, unique=True)
    description = models.CharField(max_length=255)
    display_symbol = models.CharField(max_length=10)
    figi = models.CharField(max_length=50, blank=True, null=True)
    mic = models.CharField(max_length=10, blank=True, null=True)
    type = models.CharField(max_length=50, blank=True, null=True)
    market_capitalization = models.DecimalField(max_digits=15, decimal_places=2, blank=True, null=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    ticker = models.CharField(max_length=50, blank=True, null=True)
    logo = models.URLField(blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    exchange = models.CharField(max_length=100, blank=True, null=True)
    ipo = models.DateField(blank=True, null=True)
    share_outstanding = models.DecimalField(max_digits=20, decimal_places=5, blank=True, null=True)
    weburl = models.URLField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    currency = models.CharField(max_length=10, blank=True, null=True)

    def __str__(self):
        return self.symbol


class Watchlist(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    stocks = models.ManyToManyField(Stock)

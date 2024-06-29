# stocks/models.py
from django.db import models
from ...user.baseUser.models import BaseUser

class Stock(models.Model):
    symbol = models.CharField(max_length=10, unique=True)
    description = models.CharField(max_length=255)
    display_symbol = models.CharField(max_length=10)
    type = models.CharField(max_length=50)

class Watchlist(models.Model):
    user = models.ForeignKey(BaseUser, on_delete=models.CASCADE)
    stocks = models.ManyToManyField(Stock)

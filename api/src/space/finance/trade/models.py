from django.conf import settings
from django.db import models

class PriceBar(models.Model):
    symbol    = models.CharField(max_length=10, db_index=True)
    timeframe = models.CharField(max_length=5, db_index=True)  # e.g. "1D"
    timestamp = models.DateTimeField(db_index=True)
    open      = models.FloatField()
    high      = models.FloatField()
    low       = models.FloatField()
    close     = models.FloatField()
    volume    = models.BigIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ("symbol", "timeframe", "timestamp")
        ordering = ["symbol", "timeframe", "timestamp"]

    def __str__(self):
        return f"{self.symbol} {self.timeframe} @ {self.timestamp}"

class Watchlist(models.Model):
    user      = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="watchlists"
    )
    name      = models.CharField(max_length=100, default="My Watchlist")
    created   = models.DateTimeField(auto_now_add=True)
    updated   = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {self.name}"

class WatchlistItem(models.Model):
    watchlist = models.ForeignKey(
        Watchlist,
        on_delete=models.CASCADE,
        related_name="items"
    )
    symbol    = models.CharField(max_length=10)
    order     = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("watchlist", "symbol")
        ordering = ["order"]

    def __str__(self):
        return f"{self.symbol} in {self.watchlist.name}"

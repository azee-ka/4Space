from rest_framework import serializers
from .models import Watchlist, WatchlistItem

class WatchlistItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = WatchlistItem
        fields = ["symbol", "order"]

class WatchlistSerializer(serializers.ModelSerializer):
    items = WatchlistItemSerializer(many=True)

    class Meta:
        model = Watchlist
        fields = ["id", "name", "items"]

    def create(self, validated_data):
        items_data = validated_data.pop("items", [])
        wl = Watchlist.objects.create(
            user=self.context["request"].user,
            **validated_data
        )
        for idx, item in enumerate(items_data):
            WatchlistItem.objects.create(
                watchlist=wl,
                symbol=item["symbol"],
                order=idx
            )
        return wl

    def update(self, instance, validated_data):
        items_data = validated_data.pop("items", [])
        instance.name = validated_data.get("name", instance.name)
        instance.save()
        # wipe & recreate items
        instance.items.all().delete()
        for idx, item in enumerate(items_data):
            WatchlistItem.objects.create(
                watchlist=instance,
                symbol=item["symbol"],
                order=idx
            )
        return instance

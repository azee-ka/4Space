# space/library/serializers.py
from rest_framework import serializers
from .models import LibraryItem

class LibraryItemSerializer(serializers.ModelSerializer):
    shareable_url = serializers.CharField(read_only=True)

    class Meta:
        model = LibraryItem
        fields = "__all__"

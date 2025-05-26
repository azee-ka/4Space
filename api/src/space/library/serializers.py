# space/library/serializers.py

from rest_framework import serializers
from .models import *

class LibraryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryItem
        fields = "__all__"

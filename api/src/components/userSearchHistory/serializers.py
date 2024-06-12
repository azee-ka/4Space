# serializers.py
from rest_framework import serializers
from ...user.interactUser.serializers import InteractUserSerializer
from .models import SearchHistory

class SearchHistorySerializer(serializers.ModelSerializer):
    searched_user = InteractUserSerializer()

    class Meta:
        model = SearchHistory
        fields = ['id', 'searched_user', 'timestamp']

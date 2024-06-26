# serializers.py
from rest_framework import serializers
from ...user.timelineUser.serializers import TimelineUserSerializer
from .models import SearchHistory

class SearchHistorySerializer(serializers.ModelSerializer):
    searched_user = TimelineUserSerializer()

    class Meta:
        model = SearchHistory
        fields = ['id', 'searched_user', 'timestamp']

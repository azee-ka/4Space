# serializers.py
from rest_framework import serializers
from ..user.serializers import BaseUserSerializer
from .models import SearchHistory

class SearchHistorySerializer(serializers.ModelSerializer):
    searched_user = BaseUserSerializer()

    class Meta:
        model = SearchHistory
        fields = ['id', 'searched_user', 'timestamp']

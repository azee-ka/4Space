# serializers.py
from rest_framework import serializers
from ...user.baseUser.serializers import IdealUserSerializer
from .models import SearchHistory

class SearchHistorySerializer(serializers.ModelSerializer):
    searched_user = IdealUserSerializer()

    class Meta:
        model = SearchHistory
        fields = ['id', 'searched_user', 'timestamp']

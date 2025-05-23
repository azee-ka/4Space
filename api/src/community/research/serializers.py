# research/serializers.py
from rest_framework import serializers
from .models import ResearchPublication

class ResearchPublicationSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = ResearchPublication
        fields = ['id', 'title', 'abstract', 'file', 'created_by', 'created_at']
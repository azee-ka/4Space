# research/serializers.py
from rest_framework import serializers
from .models import ResearchPublication

class ResearchPublicationSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    file = serializers.SerializerMethodField()

    class Meta:
        model = ResearchPublication
        fields = ['id', 'title', 'abstract', 'file', 'created_by', 'created_at']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None

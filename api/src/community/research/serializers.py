# research/serializers.py
from rest_framework import serializers
from .models import ResearchPublication

class ResearchPublicationSerializer(serializers.ModelSerializer):
    created_by = serializers.StringRelatedField(read_only=True)
    # Accept file on input, and output as URL
    file = serializers.FileField(required=False, allow_null=True, write_only=True)
    file_url = serializers.SerializerMethodField(read_only=True)  # for output

    class Meta:
        model = ResearchPublication
        fields = ['id', 'title', 'abstract', 'file', 'file_url', 'created_by', 'created_at']
        # Notice: "file" is for upload, "file_url" is for display

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        elif obj.file:
            return obj.file.url
        return None

    def to_representation(self, instance):
        # Only show file_url, not raw file name
        ret = super().to_representation(instance)
        # Remove raw file field from output, only use file_url
        ret.pop('file', None)
        return ret
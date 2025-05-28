# space/repos/serializers.py
from rest_framework import serializers
from .models import *

class RepositorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Repository
        fields = "__all__"

class RepositoryProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryProject
        fields = "__all__"

class RepositoryLibraryItemSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    def get_file_url(self, obj):
        request = self.context.get('request')
        if request is not None:
            # Return absolute URL
            return request.build_absolute_uri(obj.item.file.url)
        # fallback (shouldn't happen in API views)
        return obj.item.file.url

    class Meta:
        model = RepositoryLibraryItem
        fields = ["id", "repository", "alias", "path", "file_url", "pinned"]


class RepositoryTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryTask
        fields = "__all__"

class RepositoryNoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = RepositoryNote
        fields = "__all__"

from rest_framework import serializers
from .models import Album, PhotoElement

class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Album
        fields = ['id', 'name', 'description', 'created_at']


class MediaSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    file = serializers.FileField()
    media_type = serializers.CharField(max_length=50)


class PhotoElementSerializer(serializers.ModelSerializer):
    media = serializers.SerializerMethodField()
 
    class Meta:
        model = PhotoElement
        fields = ['media', 'uploaded_at', 'original_media_datetime', 'user', 'album', 'title', 'description']

    def get_media(self, obj):
        return MediaSerializer({'id': obj.id, 'file': obj.file, 'media_type': obj.media_type}).data
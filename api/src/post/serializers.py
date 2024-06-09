# src/post/serializers.py

from rest_framework import serializers
from .models import Post, Comment, MediaFile

class CommentSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            'text',
            'user',
            'created_at',
        ]

    def get_user(self, obj):
        user = obj.user
        return {
            'username': user.username,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
        }
        
class MediaFileSerializer(serializers.ModelSerializer):
    media_type = serializers.CharField()
    
    class Meta:
        model = MediaFile
        fields = ['file', 'media_type']
        
class PostSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)
    likes = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    media_files = MediaFileSerializer(many=True, read_only=False, required=False)

    class Meta:
        model = Post
        fields = [
            'text',
            'media_files',
            'id',
            'user',
            'created_at',
            'likes',
            'dislikes',
            'comments',
        ]

    def get_user(self, obj):
        user = obj.user
        custom_user = {
            'username': user.username,
            'profile_picture': user.profile_picture.url if user.profile_picture else None,
        }
        return custom_user

    def get_likes(self, obj):
        return [
            {
                'username': like.username,
                'profile_picture': like.profile_picture.url if like.profile_picture else None,
            }
            for like in obj.likes.all()
        ]

    # Add the following method if you want to get the count of likes directly
    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_dislikes(self, obj):
        return [
            {
                'username': dislike.username,
                'profile_picture': dislike.profile_picture.url if dislike.profile_picture else None,
            }
            for dislike in obj.dislikes.all()
        ]

    def get_dislikes_count(self, obj):
        return obj.dislikes.count()
    
    
    
class MinimalPostSerializer(serializers.ModelSerializer):
    media_files = MediaFileSerializer(many=True, read_only=False, required=False)
    
    
    class Meta:
        model = Post
        fields = [
            'media_files',
            'id',
        ]
        
    def get_media_files(self, obj):
        media_files = obj.media_files.all()
        if media_files:
            # Serialize only the first media file
            first_media_file = media_files[0]
            return MediaFileSerializer(first_media_file).data
        return None
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        media_files = representation.get('media_files')
        if isinstance(media_files, list) and media_files:
            # Include only the first media file in the representation
            representation['media_files'] = media_files[0]
        return representation
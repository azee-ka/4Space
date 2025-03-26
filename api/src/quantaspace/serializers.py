from rest_framework import serializers
from .models import Packet
from ..user.serializers import EssentialUserSerializer


class TimelinePacketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Packet
        fields = ['uuid']


class PacketSerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    likes = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    like_status = serializers.SerializerMethodField()
    dislike_status = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Packet
        fields = [
            'uuid', 
            'author', 
            'content', 
            'hashtags', 
            'mentions', 
            'created_at', 
            'updated_at', 
            'likes', 
            'dislikes', 
            'retweet_count', 
            'reply_count', 
            'is_sensitive', 
            'poll_options', 
            'poll_votes', 
            'mood', 
            'retweet_count', 
            'replies', 
            'flags', 
            'uploaded_files',
            'like_status',
            'dislike_status',
            'likes_count',
            'dislikes_count',
        ]
    
    def get_likes(self, obj):
        return [
            {
                'username': like.username,
                'profile_image': like.profile_image.url if like.profile_image else None,
            }
            for like in obj.likes.all()
        ]

    def get_dislikes(self, obj):
        return [
            {
                'username': dislike.username,
                'profile_image': dislike.profile_image.url if dislike.profile_image else None,
            }
            for dislike in obj.dislikes.all()
        ]

    def get_like_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if user in obj.likes.all():
                return 'liked'
            return 'not_liked'
        return 'none'

    def get_dislike_status(self, obj):
        if self.context.get('request'):
            user = self.context.get('request').user
            if user in obj.dislikes.all():
                return 'disliked'
            return 'not_disliked'
        return 'none'

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_dislikes_count(self, obj):
        return obj.dislikes.count()


class CreatePacketSerializer(serializers.ModelSerializer):
    class Meta:
        model = Packet
        fields = ['content', 'is_sensitive', 'uploaded_files', 'is_private', 'packet_type']
    
    def create(self, validated_data):
        # Automatically assign the current user as the author
        validated_data['author'] = self.context['request'].user
        return super().create(validated_data)
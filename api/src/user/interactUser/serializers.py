# serializers.py
from rest_framework import serializers
from .models import InteractUser
from ..baseUser.serializers import BaseUserSerializer
from ...post.serializers import PostSerializer, MinimalPostSerializer

class InteractUserSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        model = InteractUser
        fields = BaseUserSerializer.Meta.fields + ['followers_count', 'following_count', 'followers_list', 'following_list']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_followers_list(self, obj):
        return InteractUserSerializer(obj.followers.all(), many=True).data

    def get_following_list(self, obj):
        return InteractUserSerializer(obj.following.all(), many=True).data


class InteractUserBriefSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    connections_list = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        model = InteractUser
        fields = ['followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_followers_list(self, obj):
        return InteractUserSerializer(obj.followers.all(), many=True).data

    def get_following_list(self, obj):
        return InteractUserSerializer(obj.following.all(), many=True).data
    
    def get_connections_count(self, obj):
        return obj.connections.count()
    
    def get_connections_list(self, obj):
        return InteractUserSerializer(obj.connections.all(), many=True).data
    
    
    
    
    
    
class PublicProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    
    class Meta:
        model = InteractUser
        fields = ['username', 'date_joined', 'followers_count', 'following_count', 'connections_count', 'is_private']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_is_private(self, obj):
        return obj.is_private_profile


class PrivateProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    connections_list = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()
    
    class Meta:
        model = InteractUser
        fields = ['username', 'is_private', 'date_joined', 'followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list', 'posts']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_followers_list(self, obj):
        return InteractUserSerializer(obj.followers.all(), many=True).data

    def get_following_list(self, obj):
        return InteractUserSerializer(obj.following.all(), many=True).data
    
    def get_connections_count(self, obj):
        return obj.connections.count()
    
    def get_connections_list(self, obj):
        return InteractUserSerializer(obj.connections.all(), many=True).data

    def get_is_private(self, obj):
        return obj.is_private_profile
    
    def get_posts(self, obj):
        posts = obj.posts.all()  # Get all posts related to the user
        return MinimalPostSerializer(posts, many=True).data
# serializers.py
from rest_framework import serializers
from .models import InteractUser
from ..baseUser.serializers import BaseUserSerializer
from ...post.serializers import PostSerializer, MinimalPostSerializer
from ..baseUser.serializers import UserSerializer

class SimplifiedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = InteractUser
        fields = ['id', 'username', 'profile_picture'] 
        
        
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
        return SimplifiedUserSerializer(obj.followers.all(), many=True).data

    def get_following_list(self, obj):
        return SimplifiedUserSerializer(obj.following.all(), many=True).data


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
    connections_count = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_connected = serializers.SerializerMethodField()
    user = UserSerializer(source='*')
    follow_request_status = serializers.SerializerMethodField()

    class Meta:
        model = InteractUser
        fields = ['user', 'date_joined', 'followers_count', 'following_count', 'connections_count', 'is_private', 'is_following', 'is_connected', 'follow_request_status']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_connections_count(self, obj):
        return obj.connections.count()

    def get_is_private(self, obj):
        return obj.is_private_profile

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.interactuser.id).exists()
        return False

    def get_is_connected(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.connections.filter(id=request.user.interactuser.id).exists()
        return False

    def get_follow_requests_received(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.follow_requests_received.filter(id=request.user.interactuser.id).exists()
        return False
    
    def get_follow_request_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            current_user = request.user.interactuser
            follow_request_sent = obj.follow_requests.filter(id=current_user.id).exists()
            return follow_request_sent
        return False

class PrivateProfileSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    connections_list = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_connected = serializers.SerializerMethodField()
    user = UserSerializer(source='*')

    class Meta:
        model = InteractUser
        fields = ['user', 'is_private', 'date_joined', 'followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list', 'posts', 'is_following', 'is_connected']

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

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(id=request.user.interactuser.id).exists()
        return False

    def get_is_connected(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.connections.filter(id=request.user.interactuser.id).exists()
        return False

    def get_posts(self, obj):
        posts = obj.posts.all()
        return MinimalPostSerializer(posts, many=True).data
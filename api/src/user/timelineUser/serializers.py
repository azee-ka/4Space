# serializers.py
from rest_framework import serializers
from .models import TimelineUser
from ..baseUser.serializers import BaseUserSerializer
from ...apps.timeline.post.serializers import PostSerializer, MinimalPostSerializer
from ..baseUser.serializers import UserSerializer, PartialUserSerializer
    
        
class TimelineUserSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()
    connections_list = serializers.SerializerMethodField()
    posts = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        model = TimelineUser
        fields = ['user', 'followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list', 'posts']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()
    
    def get_connections_count(self, obj):
        return obj.connections.count()

    def get_followers_list(self, obj):
        followers = obj.followers.all()  # This fetches TimelineUser instances
        follower_users = [follower.user for follower in followers]  # Extract BaseUser instances
        return UserSerializer(follower_users, many=True).data

    def get_following_list(self, obj):
        following = obj.following.all()  # This fetches TimelineUser instances
        following_users = [following.user for following in following]  # Extract BaseUser instances
        return UserSerializer(following_users, many=True).data
    
    def get_connections_list(self, obj):
        connections = obj.connections.all()
        connections_users = [connection.user for connection in connections] 
        return UserSerializer(connections_users, many=True).data
    
    def get_posts(self, obj):
        posts = obj.posts.all().order_by('-created_at')
        context = {'current_post': None, 'posts_queryset': posts}
        return MinimalPostSerializer(posts, many=True, context=context).data
    


class TimelineUserBriefSerializer(serializers.ModelSerializer):
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_list = serializers.SerializerMethodField()
    following_list = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    connections_list = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        model = TimelineUser
        fields = ['followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_followers_list(self, obj):
        followers = obj.followers.all()  # This fetches TimelineUser instances
        follower_users = [follower.user for follower in followers]  # Extract BaseUser instances
        return UserSerializer(follower_users, many=True).data

    def get_following_list(self, obj):
        following = obj.following.all()  # This fetches TimelineUser instances
        following_users = [following.user for following in following]  # Extract BaseUser instances
        return UserSerializer(following_users, many=True).data
    
    def get_connections_list(self, obj):
        connections = obj.connections.all()
        connections_users = [connection.user for connection in connections] 
        return UserSerializer(connections_users, many=True).data
    
    def get_connections_count(self, obj):
        return obj.connections.count()
    
    
    
    
    
class PartialTimelineProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    followers_count = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    connections_count = serializers.SerializerMethodField()
    is_private = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()
    is_connected = serializers.SerializerMethodField()
    follow_request_status = serializers.SerializerMethodField()

    class Meta:
        model = TimelineUser
        fields = ['user', 'followers_count', 'following_count', 'connections_count', 'is_private', 'is_following', 'is_connected', 'follow_request_status']

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
            return obj.followers.filter(user=request.user).exists()
        return False

    def get_is_connected(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.connections.filter(user=request.user).exists()
        return False

    def get_follow_requests_received(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.follow_requests_received.filter(user=request.user).exists()
        return False
    
    def get_follow_request_status(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            current_user = request.user.interactuser.user
            follow_request_sent = obj.follow_requests.filter(user=request.user).exists()
            return follow_request_sent
        return False

class FullTimelineProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
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

    class Meta:
        model = TimelineUser
        fields = ['user', 'is_private', 'followers_count', 'following_count', 'followers_list', 'following_list', 'connections_count', 'connections_list', 'posts', 'is_following', 'is_connected']

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def get_followers_list(self, obj):
        followers = obj.followers.all()  # This fetches TimelineUser instances
        follower_users = [follower.user for follower in followers]  # Extract BaseUser instances
        return UserSerializer(follower_users, many=True).data

    def get_following_list(self, obj):
        following = obj.following.all()  # This fetches TimelineUser instances
        following_users = [following.user for following in following]  # Extract BaseUser instances
        return UserSerializer(following_users, many=True).data
    
    def get_connections_list(self, obj):
        connections = obj.connections.all()
        connections_users = [connection.user for connection in connections] 
        return UserSerializer(connections_users, many=True).data

    def get_connections_count(self, obj):
        return obj.connections.count()

    def get_is_private(self, obj):
        return obj.is_private_profile

    def get_is_following(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.followers.filter(user=request.user).exists()
        return False

    def get_is_connected(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.connections.filter(user=request.user).exists()
        return False

    def get_posts(self, obj):
        posts = obj.posts.all().order_by('-created_at')
        context = {'current_post': None, 'posts_queryset': posts}
        return MinimalPostSerializer(posts, many=True, context=context).data
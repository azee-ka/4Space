from rest_framework import serializers
from django.core.exceptions import ValidationError, ObjectDoesNotExist
from .models import Exchange, Entry, Comment, Score, Flag, ImpactScore, ExchangeMember, CommentVote
from ..user.models import BaseUser
from ..user.serializers import EssentialUserSerializer


# Exchange Serializer
class ExchangeSerializer(serializers.ModelSerializer):
    creator = serializers.PrimaryKeyRelatedField(queryset=BaseUser.objects.all(), required=False)
    
    class Meta:
        model = Exchange
        fields = [
            'uuid', 'name', 'description', 'category', 'creator', 'tags', 'rules', 'created_at', 'updated_at',
            'upvotes', 'downvotes', 'net_votes', 'reactions', 'flags',
            'flagged_content_count', 'flagged_content_ratio', 'verified_content_count', 
            'verified_content_ratio', 'toxicity_score', 'misinformation_score', 
            'echo_chamber_score', 'spam_score', 'bot_activity_score', 'community_health_score',
            'positive_impact_score', 'negative_impact_score', 'net_impact_score', 'historical_data',
            'user_contributions', 'allow_anonymous_posts', 'allow_link_sharing', 
            'strict_moderation_mode', 'tools_enabled', 'monetization_options', 'funding_raised', 'total_entries'
        ]

    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data.pop('creator', None)
        validated_data['creator'] = request_user
        return Exchange.objects.create(**validated_data)

class MinimalExchangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exchange
        fields = [ 'uuid', 'name']

# Comment Serializer
class CommentSerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    entry_title = serializers.CharField(source='entry.title', read_only=True)
    parent_comment_id = serializers.IntegerField(source='parent_comment.id', read_only=True)
    replies = serializers.SerializerMethodField()
    upvotes = serializers.SerializerMethodField()
    downvotes = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'entry', 'author', 'content', 'parent_comment_id',
            'created_at', 'updated_at', 'score', 'entry_title', 'replies',
            'upvotes', 'downvotes',
        ]

    def get_upvotes(self, obj):
        return CommentVote.objects.filter(comment=obj, vote_type='upvote').count()

    def get_downvotes(self, obj):
        return CommentVote.objects.filter(comment=obj, vote_type='downvote').count()

    def get_replies(self, obj):
        # Fetch only direct replies to the current comment
        replies = obj.replies.all()
        return CommentSerializer(replies, many=True).data

    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data['author'] = request_user
        return Comment.objects.create(**validated_data)


# Score Serializer
class ScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Score
        fields = ['id', 'content_type', 'content_id', 'score_type', 'created_at']

# Flag Serializer
class FlagSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Related user for flagging
    content_details = serializers.SerializerMethodField()

    class Meta:
        model = Flag
        fields = ['id', 'content_type', 'content_id', 'reason', 'user', 'created_at', 'content_details']

    def get_content_details(self, obj):
        content_model = obj.content_type.lower()
        content_id = obj.content_id
        if content_model == 'entry':
            try:
                content = Entry.objects.get(id=content_id)
                return {'title': content.title, 'content': content.content}
            except Entry.DoesNotExist:
                return {'error': 'Content not found'}
        return {'error': 'Unknown content type'}

# Impact Score Serializer
class ImpactScoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = ImpactScore
        fields = ['id', 'entry', 'upvotes', 'downvotes', 'comments', 'shares', 'engagement_score']

    def create(self, validated_data):
        impact_score = ImpactScore(**validated_data)
        impact_score.calculate_engagement()
        return impact_score

# Exchange Member Serializer (for membership-related details)
class ExchangeMemberSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Reference to the custom User model
    exchange_name = serializers.CharField(source='exchange.name', read_only=True)
    joined_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = ExchangeMember
        fields = ['user', 'exchange', 'exchange_name', 'joined_at']

    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data['user'] = request_user
        return ExchangeMember.objects.create(**validated_data)


class CommentVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = CommentVote
        fields = ['user', 'comment', 'vote_type']



# Entry Serializer
class EntrySerializer(serializers.ModelSerializer):
    author = EssentialUserSerializer(read_only=True)
    exchange_name = serializers.CharField(source='exchange.name', read_only=True)
    exchange_uuid = serializers.CharField(source='exchange.uuid', read_only=True)
    impact_score = ImpactScoreSerializer(read_only=True)
    score = serializers.IntegerField(read_only=True)
    flags = FlagSerializer(many=True, read_only=True)
    comments = serializers.SerializerMethodField()

    class Meta:
        model = Entry
        fields = [
            'uuid', 'id', 'title', 'content', 'author', 'exchange', 'created_at', 'updated_at', 
            'score', 'impact_score', 'flags', 'exchange_name', 'comments',
            'upvotes', 'downvotes', 'net_votes', 'comments_count', 'exchange_uuid'
        ]

    def get_comments(self, obj):
        # Fetch top-level comments only
        top_level_comments = obj.comments.filter(parent_comment__isnull=True)
        return CommentSerializer(top_level_comments, many=True).data
    
    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data['author'] = request_user
        return Entry.objects.create(**validated_data)
